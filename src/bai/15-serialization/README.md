# Bài 15 — Serialization

## Chỉ cần nhớ

- `JSON.stringify(entity)` gọi `toJSON()` của entity (JS thuần: có `toJSON()` thì `stringify` dùng nó, như `Date`).
- Quan hệ **chưa load** → bị bỏ qua hẳn khỏi JSON. Không in `[]`, không báo lỗi. Muốn có thì `populate`.
- `@Property({ hidden: true })` → field **không xuất hiện trong JSON**, nhưng:
  - vẫn được `select` từ DB,
  - vẫn nằm trên object trong RAM, `u.email` đọc bình thường.
  - → `hidden` là để **không lộ ra response API**, không phải để khỏi load. Khỏi load là chuyện của bài 20.
- Populate `posts` rồi stringify user → `posts` có mặt, nhưng `author` trong từng post chỉ là **số id**. Lý do: `author` chính là object user đang được in (Identity Map, bài 1), in đầy đủ sẽ lặp vô hạn. JS thuần gặp cảnh này thì `JSON.stringify` ném lỗi *circular structure*; MikroORM tránh bằng cách in id.

## Kết quả đã chạy

- 15A: không populate → JSON có `email`, không có `posts`.
- 15B: thêm `hidden: true` cho `email` → JSON mất `email`, nhưng `console.log(u.email)` vẫn ra `than@example.com`.
- 15C: `populate: ['posts']` → JSON có `posts`, mỗi post có `author: 1`.

## Ghi chú kỹ thuật

- Entity `User` giữ `email` là `hidden: true` cho các bài sau.
- Chưa đụng: `wrap(e).toObject()`, `serialize()` với tuỳ chọn riêng từng lần, và kiểu `Hidden` cho TypeScript. Gặp ở công ty thì quay lại.
