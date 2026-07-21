import { primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const favorites = sqliteTable(
  "favorites",
  {
    userId: text("user_id").notNull(),
    postId: text("post_id").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.postId] })],
);
