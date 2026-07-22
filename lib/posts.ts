import rawPosts from "../public/posts.json";

export type Post = {
  id: string;
  author: string;
  handle: string;
  date: string;
  text: string;
  zh: string;
  sourceUrl: string;
  kind: "summary" | "excerpt" | "full";
};

export const posts: Post[] = rawPosts.map((post) => ({
  ...post,
  author: "Dan Koe",
  handle: "@thedankoe",
  sourceUrl: `https://x.com/thedankoe/status/${post.id}`,
  kind: post.kind === "full" ? "full" as const : post.kind === "excerpt" ? "excerpt" as const : "summary" as const,
}));
