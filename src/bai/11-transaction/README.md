# Bài 11 — Transaction

## Chỉ cần nhớ

- Mỗi `flush()` tự mở/đóng transaction riêng: `begin ... commit`. Gọi `flush()` nhiều lần rời nhau = nhiều giao dịch tách biệt, không liên quan gì nhau.
- `em.transactional(async (em) => { ... })` mở **một** `begin` từ đầu khối, đóng **một** `commit` ở cuối. Các `flush()` gọi bên trong không tự mở transaction nữa — chỉ góp chung vào giao dịch đang mở.
- Lỗi ném ra giữa chừng bên trong `transactional()` → nó tự bắt, gọi `rollback` thay vì `commit`, rồi mới ném lỗi ra ngoài. `rollback` xoá sạch **mọi thứ từ `begin`** — kể cả `INSERT` đã "chạy" (gửi xuống DB) trước đó, vì chưa `commit` thì chưa phải ghi thật.
- Khác với `try/catch` JS thuần: catch JS chỉ dừng code chạy tiếp, không tự undo gì. DB thì có cơ chế riêng để undo — nhưng chỉ tính từ lúc `begin` tới trước `commit`.

## `transactional()` lồng nhau → savepoint

- DB không cho mở nhiều `begin` chồng lên nhau thật sự. Gọi `em.transactional()` bên trong một `em.transactional()` khác → **không** sinh `begin` mới, mà sinh `savepoint trxN`.
- Lỗi bên trong khối lồng chỉ `rollback` **về savepoint đó** — mất đúng phần việc bên trong. Phần ngoài (trước và sau đoạn lồng, cùng khối `transactional()` lớn) không bị đụng, vẫn `flush` bình thường tiếp và commit cùng giao dịch ngoài.
- Nói cách khác: savepoint = "điểm lưu tạm" cho phép hủy một phần công việc mà không phải hủy sạch cả giao dịch lớn.

## `@Transactional()` (NestJS)

Repo này không dùng Nest nên không test trực tiếp được, nhưng về bản chất decorator `@Transactional()`
của `@mikro-orm/nestjs` chỉ là NestJS tự động bọc method đó bằng đúng `em.transactional()` đã học ở trên —
khác mỗi cú pháp (decorator thay vì gọi tay). Áp dụng y hệt vào code NestJS ở công ty.

## Kết quả đã chạy

- 2 `flush()` rời nhau, không wrap → **2 cặp** `begin...commit`.
- Wrap 2 `flush()` đó trong `em.transactional()` → **1 cặp** `begin...commit`.
- Ném lỗi giữa chừng trong `transactional()` (sau khi đã `flush()` 1 lần) → log có `rollback`, dữ liệu đã flush **biến mất**.
- Lồng `transactional()` trong `transactional()` → chỉ **1 cặp** `begin...commit` ở ngoài, có thêm `savepoint trx1`.
- Lỗi trong khối lồng → chỉ mất `Comment B` (phần trong savepoint); `Comment A` (trước) và `Comment C` (sau, cùng khối ngoài) **vẫn còn** trong DB.
