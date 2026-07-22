import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const root = process.cwd();
const publicPath = path.join(root, "public", "posts.json");
const docsPath = path.join(root, "docs", "posts.json");
const profileUrl = "https://www.twstalker.com/thedankoe";
const apiUrl = "https://www.twstalker.com/service/api";
const twitterEpoch = 1288834974657n;
const twoYearsAgo = new Date();
twoYearsAgo.setUTCFullYear(twoYearsAgo.getUTCFullYear() - 2);
twoYearsAgo.setUTCHours(0, 0, 0, 0);

const existing = JSON.parse(await readFile(publicPath, "utf8"));
const existingById = new Map(existing.map((post) => [post.id, post]));

const html = await fetchText(profileUrl);
const cursorMatch = html.match(/class="add-nw-event"[\s\S]*?data-cursor="([^"]+)"[\s\S]*?data-query="([^"]+)"[\s\S]*?data-ec="([^"]+)"/);
if (!cursorMatch) throw new Error("Could not locate the public profile cursor");

const collected = new Map();
for (const tweet of parseProfileHtml(html)) collected.set(tweet.id, tweet);

let cursor = decodeEntities(cursorMatch[1]);
const profileId = cursorMatch[2];
let page = Number(cursorMatch[3]);
let reachedCutoff = false;

const cachedPages = existing.length < 500 ? await loadCachedPages() : [];
for (const payload of cachedPages) collectPayload(payload);

while (!cachedPages.length && cursor && page < 220 && !reachedCutoff) {
  const payload = await fetchPage(page, cursor, profileId);
  cursor = typeof payload?.cursor === "string" ? payload.cursor : "";
  const tweets = payload?.tweets && typeof payload.tweets === "object" ? Object.values(payload.tweets) : [];
  let oldest = null;
  let foundKnown = false;

  for (const tweet of tweets) {
    const normalized = normalizeApiTweet(tweet);
    if (!normalized) continue;
    collected.set(normalized.id, normalized);
    if (existingById.has(normalized.id)) foundKnown = true;
    if (!oldest || normalized.createdAt < oldest) oldest = normalized.createdAt;
  }

  if ((oldest && oldest < twoYearsAgo) || foundKnown) reachedCutoff = true;
  page += 1;
  await delay(650);
}

const originals = [...collected.values()]
  .filter((tweet) => tweet.createdAt >= twoYearsAgo)
  .filter((tweet) => !tweet.isRetweet && !tweet.isReply)
  .filter((tweet) => tweet.text.length >= 18)
  .filter((tweet) => !/^x\.com\/i\/article/i.test(tweet.text))
  .sort((a, b) => b.createdAt - a.createdAt);

const postsById = new Map(
  existing
    .filter((post) => dateFromSnowflake(post.id) >= twoYearsAgo)
    .map((post) => [post.id, { ...post, kind: post.kind || "summary" }]),
);
for (const tweet of originals) {
  if (postsById.has(tweet.id)) continue;
  postsById.set(tweet.id, {
    id: tweet.id,
    date: formatMonth(tweet.createdAt),
    text: excerpt(tweet.text),
    zh: "",
    kind: "excerpt",
  });
}
const posts = [...postsById.values()].sort((a, b) => (BigInt(a.id) > BigInt(b.id) ? -1 : 1));

const missing = posts.filter((post) => !post.zh);
for (let index = 0; index < missing.length; index += 14) {
  const batch = missing.slice(index, index + 14);
  const translated = await translateBatch(batch.map((post) => post.text));
  batch.forEach((post, offset) => { post.zh = translated[offset] || post.text; });
  process.stdout.write(`\rTranslated ${Math.min(index + batch.length, missing.length)} / ${missing.length}`);
  await delay(250);
}
if (missing.length) process.stdout.write("\n");

const normalizedPosts = posts.map((post) => ({
  id: post.id,
  date: post.date,
  text: post.text,
  zh: post.zh,
  kind: post.kind === "summary" ? "summary" : "excerpt",
}));
const json = `${JSON.stringify(normalizedPosts, null, 2)}\n`;
await writeFile(publicPath, json);
await writeFile(docsPath, json);
console.log(`Synced ${normalizedPosts.length} original posts since ${twoYearsAgo.toISOString().slice(0, 10)}.`);

async function fetchPage(pageNumber, pageCursor, data) {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const body = new URLSearchParams({ page: String(pageNumber), cursor: pageCursor, data, action: "profile" });
      const output = await curl(apiUrl, [
        "--request", "POST",
        "--header", "content-type: application/x-www-form-urlencoded; charset=UTF-8",
        "--header", `referer: ${profileUrl}`,
        "--header", "x-requested-with: XMLHttpRequest",
        "--data", body.toString(),
      ]);
      const value = JSON.parse(output);
      if (
        value &&
        typeof value === "object" &&
        ((value.tweets && typeof value.tweets === "object") || !value.cursor)
      ) return value;
    } catch {}
    await delay(attempt * 1800);
  }
  throw new Error(`Public archive stopped responding at page ${pageNumber}`);
}

async function fetchText(url) {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      return await curl(url);
    } catch (error) {
      if (attempt === 5) throw error;
    }
    await delay(attempt * 1800);
  }
  throw new Error(`Request failed: ${url}`);
}

function parseProfileHtml(source) {
  const items = [];
  const pattern = /<a href="\/thedankoe\/status\/(\d+)">[^<]+<\/a>[\s\S]*?<div class="activity-descp">\s*<p>([\s\S]*?)<\/p>/g;
  for (const match of source.matchAll(pattern)) {
    const text = cleanText(match[2]);
    items.push({
      id: match[1],
      text,
      createdAt: dateFromSnowflake(match[1]),
      isReply: text.startsWith("@"),
      isRetweet: false,
    });
  }
  return items;
}

function normalizeApiTweet(tweet) {
  if (!tweet?.conversation_id_str || tweet?.core?.screen_name !== "thedankoe") return null;
  const text = cleanText(tweet.full_text || "");
  return {
    id: tweet.conversation_id_str,
    text,
    createdAt: tweet.created_at ? new Date(tweet.created_at) : dateFromSnowflake(tweet.conversation_id_str),
    isReply: text.startsWith("@"),
    isRetweet: tweet.is_retweet === true,
  };
}

function collectPayload(payload) {
  const tweets = payload?.tweets && typeof payload.tweets === "object" ? Object.values(payload.tweets) : [];
  for (const tweet of tweets) {
    const normalized = normalizeApiTweet(tweet);
    if (normalized) collected.set(normalized.id, normalized);
  }
}

async function loadCachedPages() {
  try {
    const names = (await readdir(path.join(root, "work")))
      .filter((name) => /^twstalker-page\d+\.json$/.test(name))
      .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
    return Promise.all(names.map(async (name) => JSON.parse(await readFile(path.join(root, "work", name), "utf8"))));
  } catch {
    return [];
  }
}

function cleanText(value) {
  return decodeEntities(value.replace(/<[^>]+>/g, " "))
    .replace(/https?:\/\/t\.co\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function excerpt(value) {
  const words = value.split(/\s+/);
  return words.length <= 24 ? value : `${words.slice(0, 24).join(" ")}…`;
}

async function translateBatch(texts) {
  if (!texts.length) return [];
  const separator = " ZXQSPLIT7F3 ";
  const joined = texts.join(separator);
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.search = new URLSearchParams({ client: "gtx", sl: "en", tl: "zh-CN", dt: "t", q: joined }).toString();
  const data = JSON.parse(await curl(url.toString()));
  const translated = (data[0] || []).map((part) => part[0] || "").join("");
  const parts = translated.split(/\s*ZXQSPLIT7F3\s*/i);
  if (parts.length === texts.length) return parts.map((part) => part.trim());
  const singles = [];
  for (const text of texts) {
    const singleUrl = new URL("https://translate.googleapis.com/translate_a/single");
    singleUrl.search = new URLSearchParams({ client: "gtx", sl: "en", tl: "zh-CN", dt: "t", q: text }).toString();
    const singleData = JSON.parse(await curl(singleUrl.toString()));
    singles.push((singleData[0] || []).map((part) => part[0] || "").join("").trim());
    await delay(120);
  }
  return singles;
}

async function curl(url, extraArgs = []) {
  const { stdout } = await execFileAsync("curl", [
    "--fail-with-body",
    "--silent",
    "--show-error",
    "--location",
    "--max-time", "30",
    "--retry", "5",
    "--retry-all-errors",
    "--retry-delay", "1",
    ...extraArgs,
    String(url),
  ], { maxBuffer: 10 * 1024 * 1024 });
  return stdout;
}

function dateFromSnowflake(id) {
  return new Date(Number((BigInt(id) >> 22n) + twitterEpoch));
}

function formatMonth(date) {
  return `${date.getUTCFullYear()} · ${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
