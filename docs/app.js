const posts = [
  ["1874444212881736189", "2025 · 01", "The plan for 2025 is to write, walk, read, build, train, and adapt as usual.", "2025 年的计划依旧很简单：写作、散步、阅读、创造、训练，并持续调整。"],
  ["1859223923306676732", "2024 · 11", "The more technology advances, the more important it is to be a generalist, polymath, and creator.", "技术越进步，成为通才、博学者和创造者就越重要。"],
  ["1859277894926622758", "2024 · 11", "When you focus on a niche, you box yourself in for no reason and limit yourself.", "当你只盯着一个狭窄领域时，你会毫无必要地把自己框住，限制自己的可能性。"],
  ["1860009096088560040", "2024 · 11", "Start a one-person business. Build enough cash flow to leave your job.", "先从一人公司开始。创造足够的现金流，让自己能够离开原来的工作。"],
  ["1883537883954602244", "2025 · 01", "There is a way you can view the situation that gives you control.", "总有一种看待处境的方式，能让你重新拿回掌控感。"],
  ["1885648038108303449", "2025 · 02", "The solution to your problem isn't found in one more piece of information.", "你问题的答案，往往不在下一条新信息里。"],
  ["1890778829410668950", "2025 · 02", "Your advantage is rarely one interest. It is the intersection of everything you care enough to learn.", "你的优势很少来自单一兴趣，而来自你愿意深入学习的所有兴趣的交汇处。"],
  ["1899859526180114919", "2025 · 03", "Avoid learning what leads to what you don't want.", "不要去学习那些只会把你带向不想要的人生的东西。"],
  ["1906357809635361205", "2025 · 03", "Protect the first focused block of your morning before the noise begins.", "在噪音开始之前，保护好早晨第一段专注时间。"],
  ["2009320195848872014", "2026 · 01", "Agency is the tendency to act toward a goal without outside prompting, instruction, or permission.", "主体性，就是不等别人提醒、指导或允许，也会主动朝目标行动。"],
  ["2010042119121957316", "2026 · 01", "Your edge lies more in the intersection of your interests than in a narrow specialty.", "真正的优势，更多藏在多个兴趣的交叉点，而不是某一个狭窄专长里。"],
  ["2012956603297964167", "2026 · 01", "Write things down. You need a vessel to focus your efforts: a project, a business, something of your own.", "把想法写下来。你需要一个承载努力的容器：项目、事业，或者真正属于自己的东西。"]
].map(([id, date, text, zh]) => ({ id, date, text, zh, author: "Dan Koe", handle: "@thedankoe", sourceUrl: `https://x.com/thedankoe/status/${id}` }));

const app = document.querySelector("#app");
let tab = "feed";
let activeIndex = 0;
let translated = new Set();
let favorites = loadFavorites();

function loadFavorites() {
  try { return new Set(JSON.parse(localStorage.getItem("signal-favorites") || "[]")); }
  catch { return new Set(); }
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function render() {
  app.innerHTML = `
    <header class="topbar"><span class="wordmark">SIGNAL</span>${tab === "feed" ? `<span class="progress">${String(activeIndex + 1).padStart(2, "0")} / ${String(posts.length).padStart(2, "0")}</span>` : ""}</header>
    ${tab === "feed" ? feedHtml() : tab === "saved" ? savedHtml() : authorsHtml()}
    <nav class="bottom-nav" aria-label="主导航">
      ${navButton("feed", "◉", "阅读")}${navButton("saved", "♡", "喜欢")}${navButton("authors", "◎", "作者")}
    </nav>`;
  bindEvents();
}

function feedHtml() {
  return `<div class="feed" aria-label="思想卡片流">${posts.map((post, index) => `
    <article class="card" data-index="${index}" id="post-${post.id}">
      <div class="author"><span class="avatar">DK</span><span><strong>${post.author}</strong>${post.handle}</span></div>
      <button class="quote-area" data-translate="${post.id}" aria-label="显示或隐藏中文翻译">
        <p class="quote">${escapeHtml(post.text)}</p>
        ${translated.has(post.id) ? `<p class="translation" lang="zh-CN">${post.zh}</p>` : ""}
        <span class="tap-hint">${translated.has(post.id) ? "轻点收起中文" : "轻点查看中文"}</span>
      </button>
      <footer class="card-footer"><div class="meta">${post.date}<br><a class="source-link" href="${post.sourceUrl}" target="_blank" rel="noreferrer">查看原帖 ↗</a></div>
      <button class="like ${favorites.has(post.id) ? "active" : ""}" data-favorite="${post.id}" aria-label="${favorites.has(post.id) ? "取消收藏" : "收藏"}">${favorites.has(post.id) ? "♥" : "♡"}</button></footer>
    </article>`).join("")}</div>`;
}

function savedHtml() {
  const saved = posts.filter((post) => favorites.has(post.id));
  return `<section class="panel"><h1>喜欢</h1><p class="panel-lead">你最认同的思想，集中放在这里。</p>${saved.length ? `<div class="saved-list">${saved.map((post) => `<button class="saved-card" data-open="${post.id}"><p>${escapeHtml(post.text)}</p><span>Dan Koe · ${post.date}</span></button>`).join("")}</div>` : `<p class="empty">还没有收藏。<br>遇到认同的话，就点一下 ♡</p>`}</section>`;
}

function authorsHtml() {
  return `<section class="panel"><h1>作者</h1><p class="panel-lead">你的高质量信息源，会慢慢长成一座私人思想库。</p><div class="author-card"><div class="author-card-head"><span class="avatar">DK</span><div><h2>Dan Koe</h2><span class="meta">@thedankoe</span></div></div><p>首版收录 12 条带原帖链接的精选试读。完整近两年历史内容需要通过授权的 X 数据导出或接口批量导入。</p><span class="status-pill">● 已启用</span></div><div class="add-author"><strong>＋ 添加下一位作者</strong><span>结构已经准备好，之后只需给我作者账号。</span></div></section>`;
}

function navButton(name, icon, label) {
  return `<button class="nav-button ${tab === name ? "active" : ""}" data-tab="${name}"><span class="nav-icon">${icon}</span>${label}</button>`;
}

function bindEvents() {
  document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => { tab = button.dataset.tab; render(); }));
  document.querySelectorAll("[data-translate]").forEach((button) => button.addEventListener("click", () => { const id = button.dataset.translate; translated.has(id) ? translated.delete(id) : translated.add(id); render(); document.querySelector(`#post-${id}`).scrollIntoView(); }));
  document.querySelectorAll("[data-favorite]").forEach((button) => button.addEventListener("click", () => { const id = button.dataset.favorite; favorites.has(id) ? favorites.delete(id) : favorites.add(id); localStorage.setItem("signal-favorites", JSON.stringify([...favorites])); render(); document.querySelector(`#post-${id}`).scrollIntoView(); }));
  document.querySelectorAll("[data-open]").forEach((button) => button.addEventListener("click", () => { const id = button.dataset.open; tab = "feed"; render(); document.querySelector(`#post-${id}`).scrollIntoView(); }));
  const feed = document.querySelector(".feed");
  if (feed) feed.addEventListener("scroll", () => { const next = Math.round(feed.scrollTop / feed.clientHeight); if (next !== activeIndex && next >= 0 && next < posts.length) { activeIndex = next; const progress = document.querySelector(".progress"); if (progress) progress.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(posts.length).padStart(2, "0")}`; } }, { passive: true });
}

render();
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
