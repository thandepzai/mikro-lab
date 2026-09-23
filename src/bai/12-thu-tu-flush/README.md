# Bài 12 — Thứ tự flush

## Chỉ cần nhớ

- Trong một `flush()`, các câu SQL sinh ra **không chạy theo thứ tự bạn viết code** — MikroORM tự sắp lại.
- **Trong nhóm insert:** nếu entity A tham chiếu tới entity B (FK), B phải insert trước A — bất kể `em.create(A, ...)` được viết trước hay sau `em.create(B, ...)` trong code. MikroORM tự dựng "đồ thị phụ thuộc" giữa các entity đang chờ flush rồi sắp theo đó (giống `npm` cài dependency trước rồi mới cài package cần nó).
- **Toàn cục:** một `flush()` luôn chạy theo thứ tự **insert → update → delete**, dù trong code bạn gọi `em.create` / sửa property / `em.remove` xen kẽ nhau thế nào.
  - Insert trước: đảm bảo dữ liệu mới cần thiết đã tồn tại.
  - Delete cuối: tránh xóa mất thứ mà insert/update khác trong cùng flush còn cần tới.

## Kết quả đã chạy

- `em.create(Post, { title: ..., author: { name: ..., email: ... } })` — `Post` viết trước, `User` (author) lồng bên trong — nhưng log cho `insert into "user"` chạy **trước** `insert into "post"`.
- Một flush gồm: tạo `Post` mới (insert) + sửa tên `User` có sẵn (update) + xóa một `Post` khác (delete) → log ra đúng thứ tự **insert, update, delete**.
