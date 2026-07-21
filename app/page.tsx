import type { Metadata } from "next";
import { SignalApp } from "./signal-app";
import { posts } from "../lib/posts";

export const metadata: Metadata = {
  title: "Signal — 高质量思想流",
  description: "只刷值得你注意的思想。轻点翻译，上滑下一条。",
};

export default function Home() {
  return <SignalApp posts={posts} />;
}
