let posts = [];

const app = document.querySelector("#app");
let tab = "feed";
let activeIndex = 0;
let visibleCount = 80;
let activeTranslationId = null;
let favorites = loadFavorites();

function loadFavorites() {
  try { return new Set(JSON.parse(localStorage.getItem("signal-favorites") || "[]")); }
  catch { return new Set(); }
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  if (shuffled.length > 1 && shuffled[0] === items[0]) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }
  return shuffled;
}

function render() {
  app.innerHTML = `
    <header class="topbar"><span class="wordmark">SIGNAL</span>${tab === "feed" ? `<span class="progress">${String(activeIndex + 1).padStart(2, "0")} / ${String(posts.length).padStart(2, "0")}</span>` : ""}</header>
    ${tab === "feed" ? feedHtml() : tab === "saved" ? savedHtml() : authorsHtml()}
    ${translationHtml()}
    <nav class="bottom-nav" aria-label="主导航">
      ${navButton("feed", "◉", "阅读")}${navButton("saved", "♡", "喜欢")}${navButton("authors", "◎", "作者")}
    </nav>`;
  bindEvents();
}

function feedHtml() {
  return `<div class="feed" aria-label="思想卡片流">${posts.slice(0, visibleCount).map((post, index) => `
    <article class="card" data-index="${index}" id="post-${post.id}">
      <div class="author"><span class="avatar">DK</span><span><strong>${post.author}</strong>${post.handle}</span></div>
      <button class="quote-area ${post.text.length > 220 ? "very-long" : post.text.length > 150 ? "long" : ""}" data-translate="${post.id}" aria-label="查看完整中文翻译">
        <p class="quote">${escapeHtml(post.text)}</p>
        <span class="tap-hint">轻点查看完整中文</span>
      </button>
      <footer class="card-footer"><div class="meta">${post.date} · ${post.kind === "full" ? "完整原文" : post.kind === "summary" ? "忠实摘要" : "原文摘录"}<br><a class="source-link" href="${post.sourceUrl}" target="_blank" rel="noreferrer">查看原帖 ↗</a></div>
      <button class="like ${favorites.has(post.id) ? "active" : ""}" data-favorite="${post.id}" aria-label="${favorites.has(post.id) ? "取消收藏" : "收藏"}">${favorites.has(post.id) ? "♥" : "♡"}</button></footer>
    </article>`).join("")}</div>`;
}

function translationHtml() {
  const post = posts.find((item) => item.id === activeTranslationId);
  if (!post) return "";
  return `<section class="translation-sheet" role="dialog" aria-modal="true" aria-label="完整中文翻译">
    <button class="translation-close" data-close-translation aria-label="关闭中文翻译">×</button>
    <div class="translation-content"><span class="translation-label">中文全文</span><p class="translation-text" lang="zh-CN">${escapeHtml(post.zh)}</p><button class="translation-done" data-close-translation>读完了</button></div>
  </section>`;
}

function savedHtml() {
  const saved = posts.filter((post) => favorites.has(post.id));
  return `<section class="panel"><h1>喜欢</h1><p class="panel-lead">你最认同的思想，集中放在这里。</p>${saved.length ? `<div class="saved-list">${saved.map((post) => `<button class="saved-card" data-open="${post.id}"><p>${escapeHtml(post.text)}</p><span>Dan Koe · ${post.date}</span></button>`).join("")}</div>` : `<p class="empty">还没有收藏。<br>遇到认同的话，就点一下 ♡</p>`}</section>`;
}

function authorsHtml() {
  return `<section class="panel"><h1>作者</h1><p class="panel-lead">你的高质量信息源，会慢慢长成一座私人思想库。</p><div class="author-card"><div class="author-card-head"><span class="avatar">DK</span><div><h2>Dan Koe</h2><span class="meta">@thedankoe</span></div></div><p>已同步 ${posts.length} 条近两年公开原创内容。每次打开都会随机洗牌；卡片显示完整原文和中文翻译，并保留原帖入口。</p><span class="status-pill">● 每日自动同步</span></div><div class="add-author"><strong>＋ 添加下一位作者</strong><span>结构已经准备好，之后只需给我作者账号。</span></div></section>`;
}

function navButton(name, icon, label) {
  return `<button class="nav-button ${tab === name ? "active" : ""}" data-tab="${name}"><span class="nav-icon">${icon}</span>${label}</button>`;
}

function bindEvents() {
  document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => { tab = button.dataset.tab; render(); }));
  document.querySelectorAll("[data-translate]").forEach((button) => button.addEventListener("click", () => { activeTranslationId = button.dataset.translate; render(); }));
  document.querySelectorAll("[data-close-translation]").forEach((button) => button.addEventListener("click", () => { const id = activeTranslationId; activeTranslationId = null; render(); requestAnimationFrame(() => document.querySelector(`#post-${id}`)?.scrollIntoView()); }));
  document.querySelectorAll("[data-favorite]").forEach((button) => button.addEventListener("click", () => { const id = button.dataset.favorite; favorites.has(id) ? favorites.delete(id) : favorites.add(id); localStorage.setItem("signal-favorites", JSON.stringify([...favorites])); render(); document.querySelector(`#post-${id}`).scrollIntoView(); }));
  document.querySelectorAll("[data-open]").forEach((button) => button.addEventListener("click", () => {
    const id = button.dataset.open;
    const index = posts.findIndex((post) => post.id === id);
    visibleCount = Math.max(visibleCount, index + 1);
    tab = "feed";
    render();
    document.querySelector(`#post-${id}`)?.scrollIntoView();
  }));
  const feed = document.querySelector(".feed");
  if (feed) feed.addEventListener("scroll", () => {
    const next = Math.round(feed.scrollTop / feed.clientHeight);
    if (next !== activeIndex && next >= 0 && next < posts.length) {
      activeIndex = next;
      const progress = document.querySelector(".progress");
      if (progress) progress.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(posts.length).padStart(2, "0")}`;
    }
    if (next >= visibleCount - 8 && visibleCount < posts.length) {
      const currentId = posts[next]?.id;
      visibleCount = Math.min(posts.length, visibleCount + 80);
      render();
      requestAnimationFrame(() => document.querySelector(`#post-${currentId}`)?.scrollIntoView());
    }
  }, { passive: true });
}

app.innerHTML = `<div class="empty">正在装入思想库…</div>`;
fetch("posts.json")
  .then((response) => response.json())
  .then((data) => {
    posts = shuffle(data.map((post) => ({ ...post, kind: post.kind || "summary", author: "Dan Koe", handle: "@thedankoe", sourceUrl: `https://x.com/thedankoe/status/${post.id}` })));
    render();
  })
  .catch(() => { app.innerHTML = `<div class="empty">内容载入失败，请刷新页面。</div>`; });
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
