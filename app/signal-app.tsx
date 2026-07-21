"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Post } from "../lib/posts";

type Tab = "feed" | "saved" | "authors";

export function SignalApp({ posts }: { posts: Post[] }) {
  const [tab, setTab] = useState<Tab>("feed");
  const [translated, setTranslated] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/favorites")
      .then((response) => (response.ok ? response.json() : { ids: [] }))
      .then((data: { ids?: string[] }) => setFavorites(new Set(data.ids ?? [])))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed || tab !== "feed") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            setActiveIndex(Number((entry.target as HTMLElement).dataset.index ?? 0));
          }
        }
      },
      { root: feed, threshold: [0.6] },
    );
    feed.querySelectorAll("[data-index]").forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [tab]);

  const savedPosts = useMemo(() => posts.filter((post) => favorites.has(post.id)), [favorites, posts]);

  function toggleTranslation(id: string) {
    setTranslated((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function toggleFavorite(id: string) {
    const shouldSave = !favorites.has(id);
    setFavorites((current) => {
      const next = new Set(current);
      shouldSave ? next.add(id) : next.delete(id);
      return next;
    });
    try {
      await fetch("/api/favorites", {
        method: shouldSave ? "POST" : "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ postId: id }),
      });
    } catch {
      setFavorites((current) => {
        const next = new Set(current);
        shouldSave ? next.delete(id) : next.add(id);
        return next;
      });
    }
  }

  function openSaved(post: Post) {
    setTab("feed");
    window.setTimeout(() => {
      document.getElementById(`post-${post.id}`)?.scrollIntoView({ block: "start" });
    }, 0);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <span className="wordmark">SIGNAL</span>
        {tab === "feed" && <span className="progress">{String(activeIndex + 1).padStart(2, "0")} / {String(posts.length).padStart(2, "0")}</span>}
      </header>

      {tab === "feed" && (
        <div className="feed" ref={feedRef} aria-label="思想卡片流">
          {posts.map((post, index) => (
            <article className="card" data-index={index} id={`post-${post.id}`} key={post.id}>
              <div className="author">
                <span className="avatar">DK</span>
                <span><strong>{post.author}</strong>{post.handle}</span>
              </div>

              <button className="quote-area" onClick={() => toggleTranslation(post.id)} aria-label="显示或隐藏中文翻译">
                <p className="quote">{post.text}</p>
                {translated.has(post.id) && <p className="translation" lang="zh-CN">{post.zh}</p>}
                <span className="tap-hint">{translated.has(post.id) ? "轻点收起中文" : "轻点查看中文"}</span>
              </button>

              <footer className="card-footer">
                <div className="meta">
                  {post.date}<br />
                  <a className="source-link" href={post.sourceUrl} target="_blank" rel="noreferrer">查看原帖 ↗</a>
                </div>
                <button className={`like ${favorites.has(post.id) ? "active" : ""}`} onClick={() => toggleFavorite(post.id)} aria-label={favorites.has(post.id) ? "取消收藏" : "收藏"}>
                  {favorites.has(post.id) ? "♥" : "♡"}
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}

      {tab === "saved" && (
        <section className="panel">
          <h1>喜欢</h1>
          <p className="panel-lead">你最认同的思想，集中放在这里。</p>
          {savedPosts.length ? (
            <div className="saved-list">
              {savedPosts.map((post) => (
                <button className="saved-card" key={post.id} onClick={() => openSaved(post)}>
                  <p>{post.text}</p><span>{post.author} · {post.date}</span>
                </button>
              ))}
            </div>
          ) : <p className="empty">还没有收藏。<br />遇到认同的话，就点一下 ♡</p>}
        </section>
      )}

      {tab === "authors" && (
        <section className="panel">
          <h1>作者</h1>
          <p className="panel-lead">你的高质量信息源，会慢慢长成一座私人思想库。</p>
          <div className="author-card">
            <div className="author-card-head"><span className="avatar">DK</span><div><h2>Dan Koe</h2><span className="meta">@thedankoe</span></div></div>
            <p>首版收录 12 条带原帖链接的精选试读。完整近两年历史内容需要通过授权的 X 数据导出或接口批量导入。</p>
            <span className="status-pill">● 已启用</span>
          </div>
          <div className="add-author"><strong>＋ 添加下一位作者</strong><span>结构已经准备好，之后只需给我作者账号。</span></div>
        </section>
      )}

      <nav className="bottom-nav" aria-label="主导航">
        <button className={`nav-button ${tab === "feed" ? "active" : ""}`} onClick={() => setTab("feed")}><span className="nav-icon">◉</span>阅读</button>
        <button className={`nav-button ${tab === "saved" ? "active" : ""}`} onClick={() => setTab("saved")}><span className="nav-icon">♡</span>喜欢</button>
        <button className={`nav-button ${tab === "authors" ? "active" : ""}`} onClick={() => setTab("authors")}><span className="nav-icon">◎</span>作者</button>
      </nav>
    </main>
  );
}
