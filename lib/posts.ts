import rawPosts from "../public/posts.json";

export type Post = {
  id: string;
  author: string;
  handle: string;
  date: string;
  text: string;
  zh: string;
  sourceUrl: string;
  kind: "summary";
};

export const posts: Post[] = rawPosts.map((post) => ({
  ...post,
  author: "Dan Koe",
  handle: "@thedankoe",
  sourceUrl: `https://x.com/thedankoe/status/${post.id}`,
  kind: "summary" as const,
}));
