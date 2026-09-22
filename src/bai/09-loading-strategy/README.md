# Bài 9 — Loading strategy: `joined` vs `select-in`

## Chỉ cần nhớ

| | `joined` (mặc định v7) | `select-in` |
|---|---|---|
| Số câu | 1 câu `join` | 2 câu, câu sau dùng `where id in (...)` |
| Dữ liệu trả về | bảng phẳng, **bên "một" bị lặp** mỗi dòng | mỗi thứ đúng 1 lần |
| Hợp với | `populate: ['author']` (ManyToOne: mỗi post chỉ 1 author) | `populate: ['posts']` khi 1 user có **nhiều** post |

Cả hai đều đã chữa N+1: số câu **không tăng theo số dòng**.

Viết: `em.find(Post, {}, { populate: ['author'], strategy: 'select-in' })`

## Kết quả đã chạy

- **9A:** `find(Post)` + `populate author` + `select-in` → `select post`, rồi `select user where id in (1, 2, 3)`.
  Id lấy sẵn từ các cái vỏ (`author_id`), không cần join.
- **9B:** Than có 5 post, `findOne(User, 1, { populate: ['posts'] })`:
  - `joined` → 1 câu `left join`, **5 dòng**, dòng nào cũng mang lại `name` + `email` của Than.
  - `select-in` → `user` 1 dòng + `post` 5 dòng. `'Than'` chỉ xuất hiện 1 lần.

Bắc cầu JS: `joined` giống như trả về
`[{ name: 'Than', email, title: 'Bai 1' }, { name: 'Than', email, title: 'Bai 2' }, ...]`.
1 user có 1000 post → tên và email của user bị gửi qua mạng 1000 lần.

## Quy tắc tạm dùng

- Populate chiều **một** (`post.author`) → để mặc định `joined`.
- Populate chiều **nhiều** (`user.posts`), nhất là khi con nhiều → `select-in`.
- Không chắc → đo: nhìn `[N results]` trong log.
