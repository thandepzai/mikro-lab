# Bài 7 — `Ref` / `Reference`

## Chỉ cần nhớ 3 dòng

1. `@ManyToOne(() => User, { ref: true }) author!: Ref<User>`: TS **chặn** `post.author.name` lúc biên dịch, thay vì ra `undefined` âm thầm (bẫy 6A).
2. Lấy dữ liệu: `const a = await post.author.load()` (tự `select` lần đầu, lần sau 0 SQL).
3. Chắc chắn đã load rồi: `post.author.getEntity()`. **Tránh `unwrap()`.**

## Kết quả đã chạy

- 7A: `Property 'name' does not exist on type '{ id: number; } & Reference<User>'`. `{ id: number }` chính là cái vỏ.
- 7B: `load()` → `select ... from user where id = 1` (vỏ biết sẵn id, không join). Gọi lần 2 → 0 SQL.
- Sau `load()`, `post.author.name` **vẫn bị chặn**: TS chỉ đọc kiểu khai báo, không biết lúc chạy đã load hay chưa.

| Cách | Chưa load thì | |
|---|---|---|
| `(await post.author.load())!.name` | tự select | dùng nhiều nhất |
| `post.author.getEntity().name` | ném lỗi `Reference<User> 1 not initialized` | an toàn |
| `post.author.unwrap().name` | `undefined` âm thầm | tránh |
| `findOne(Post, 1, { populate: ['author'] })` → `p.author.$.name` | — | TS biết đã load (bài 8) |

## Biết cho hiểu (không cần nhớ)

`Ref` = class `Reference` bọc quanh cái vỏ: `{ entity, property }` + `load()` / `getEntity()` / `unwrap()`.
Cùng ý tưởng với `Collection`: quan hệ nào có thể chưa load thì MikroORM bọc vào một cái hộp có `load()`.
