import { run } from "./orm";
import { Post } from "./entities/Post";
import { Comment } from "./entities/Comment";
import { raw } from "@mikro-orm/sqlite";

run(async (em) => {
  console.log("===== NHIEM VU 1: them comment =====");
  // Đưa số id → MikroORM tự tạo "cái vỏ" Post (bài 6A) → không cần select
  em.create(Comment, { title: "Hay qua", post: 1 });
  em.create(Comment, { title: "Cam on tac gia", post: 1 });
  em.create(Comment, { title: "Doc xong roi", post: 2 });
  await em.flush(); // 1 begin, 1 insert gộp 3 dòng, 1 commit
  em.clear();

  console.log("===== NHIEM VU 2: trang danh sach bai viet =====");
  // Mở cả 2 quan hệ: author (vỏ) + comments (hộp khoá)
  const posts = await em.find(Post, {}, { populate: ["author", "comments"] });
  for (const p of posts) {
    console.log(
      p.title,
      "|",
      p.author.$.name,
      "|",
      p.comments.length,
      "comment",
    );
  }
  em.clear();

  console.log("===== NHIEM VU 3: doi ten tac gia =====");
  const post = await em.findOneOrFail(
    Post,
    { title: "Bai cua An" },
    { populate: ["author"] },
  );
  post.author.$.name = "An Nguyen"; // user nằm trong sổ → flush tự so với ảnh chụp (bài 2)
  await em.flush();
  em.clear();

  console.log("===== NHIEM VU 4: thong ke =====");
  const thongKe = await em
    .createQueryBuilder(Post, "p")
    .select(["p.title", raw("count(c.id) as so_comment")])
    .leftJoin("p.comments", "c") // left join: bài 0 comment vẫn có mặt
    .groupBy("p.id")
    .execute(); // chỉ cần đọc → execute là đủ
  console.log(thongKe);
});
