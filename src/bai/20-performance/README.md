# Bài 20 — Performance *(xong 20A–G)*

## Chỉ cần nhớ

- **Partial loading** (`fields: ["name"]`): câu `select` chỉ lấy cột cần (`id`, `name`) thay vì `u0.*`. Nhưng nếu `em` đã load đủ cột từ trước (chưa `em.clear()`), object trong Identity Map vẫn còn đủ `email` → in ra vẫn thấy.
- **Batch insert**: `batchSize` mặc định là `300`. 1000 user + `flush()` một lần → **4 câu insert** (300 + 300 + 300 + 100), trong **1** transaction.
- **`flush()` trong vòng lặp** → mỗi vòng một `begin` / `insert` / `commit`. 1000 vòng = 1000 insert + 1000 begin. ORM không gộp được vì mỗi lần chỉ thấy 1 entity.
- Quy tắc: `create` / `persist` trong vòng lặp thì được, `flush()` gọi **một lần sau vòng lặp**.
- **Result cache**: `find(User, {}, { cache: 10000 })` → lần đầu hỏi DB rồi ghi vào "sổ", lần sau còn hạn thì đọc sổ, **không `select`**. Không có `cache` thì mỗi `fork` vẫn hỏi DB (Identity Map chỉ nhớ trong một `em`).
- Cache nằm ở cấp `orm` (config), mọi `em` / `fork` dùng chung một sổ. Mặc định lưu trong **RAM** (`MemoryCacheAdapter`), hạn mặc định `expiration: 1000` (1 giây). Restart server là mất; chạy nhiều server thì mỗi server một sổ riêng → muốn dùng chung phải cắm adapter ngoài (ví dụ Redis).
- Cache có thể trả về **dữ liệu cũ**: `find` có cache → thêm user mới → `find` có cache lần nữa vẫn ra số cũ (1), `find` không cache ra số mới (2). `flush()` không đụng vào sổ.
- Muốn cache không cũ sau khi ghi: đặt tên `cache: ["ds-user", 10000]`, sau `flush()` gọi `await em.fork().clearCache("ds-user")`. Lần `find` kế tiếp tự nạp lại. Không có cách "thêm user vào cache" — chỉ xoá để nạp lại. `clearCache` gọi trên `em` toàn cục sẽ lỗi như bài 16/17.
- Chỉ cache dữ liệu chịu được cũ vài giây (danh mục, cấu hình). Không cache số dư, tồn kho, giỏ hàng.
- **Tắt Identity Map** (`find(..., { disableIdentityMap: true })`): mỗi lần `find` ra object mới (`a === b` là `false`), ORM không giữ object. Đổi `name` rồi `flush()` → **không ghi gì** vào DB vì không có object nào được theo dõi.
- Query chỉ đọc, nhiều dòng (báo cáo, export) → tắt Identity Map được. Cần sửa rồi `flush()` → để bật.

## Kết quả đã chạy

- 20A: `find` đầy đủ → `select u0.* from user`; `fields: ["name"]` → `select u0.id, u0.name from user`. Object in ra lần hai vẫn có `email` vì Identity Map giữ bản đầy đủ từ lần một.
- 20B / 20D: 1000 user, `flush()` một lần → 4 insert, 1 begin.
- 20C: `flush()` trong vòng lặp → 1000 insert, 1000 begin.
- 20E: A) hai `find` không cache → 2 select; B) hai `find` với `cache: 10000` → 1 select.
- 20F: sau khi thêm user thứ 2: `find` có cache → 1 user (cũ); `find` không cache → 2 user.
- 20F2: đặt tên cache + `clearCache` sau khi thêm user → `find` có cache trả về 2 user.
- 20G: E) `find` hai lần bình thường → `a === b` là `true`; F) `disableIdentityMap` → `false`; G) đổi `name` + `flush()` khi tắt Identity Map → DB vẫn là "An".

## Chưa kiểm chứng

- Adapter Redis thật (mới đọc config, chưa cắm thử).
- Đo thời gian / bộ nhớ khi tắt Identity Map với số dòng rất lớn (mới kiểm tra hành vi, chưa đo).
- `batchSize` đổi sang giá trị khác thì số câu insert đổi thế nào.
- Hành vi trên Postgres (đã chạy toàn bộ trên SQLite `:memory:`).

## File

`bai-20a.ts.bak` … `bai-20g.ts.bak` (có thêm `bai-20f2.ts.bak` cho phần `clearCache`).
