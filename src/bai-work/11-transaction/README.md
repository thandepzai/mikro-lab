# Bài 11 — Transaction (work-form)

Code: `module/lab/domain/service/bai11.ts`, `module/lab/app/controller/bai11.ts`.
Hàm dùng: `runInTransaction` (`module/_core/infras/orm/mikro/util.ts`) → `globalORM.em.transactional(...)`.

## Endpoint

| Endpoint | Làm gì | SQL | Kết quả DB |
|---|---|---|---|
| `POST /lab/bai11/khong-bao` | Tạo user rồi ném lỗi, không bọc | `begin` → `insert` → `commit` | User **còn** |
| `POST /lab/bai11/co-bao` | Như trên nhưng bọc `runInTransaction` | `begin` → `insert` → `rollback` | User **mất** |
| `POST /lab/bai11/thanh-cong` | Tạo 2 user trong 1 transaction, không lỗi | `begin` → `insert` × 2 → `commit` | Cả 2 **còn** |
| `POST /lab/bai11/long-nhau` | A, khối lồng (B + lỗi, có `catch`), C | `begin` → A → `savepoint` → B → `rollback to savepoint` → C → `commit` | A, C còn; B mất |
| `GET /lab/bai11/users` | Liệt kê user tên `Bai11%` | `select` | |

## Chỉ cần nhớ

- `repository.create` gọi `persistAndFlush`, nên mỗi `flush` tự bọc một cặp `begin`/`commit` nhỏ và commit ngay. Lỗi xảy ra sau đó không huỷ được.
- `runInTransaction` mở **một** `begin` cho cả khối. Có lỗi thì `rollback` mọi thứ từ `begin`, không có lỗi thì `commit` tất cả.
- `runInTransaction` lồng nhau không tạo `begin` mới mà tạo `savepoint`. Lỗi trong khối lồng chỉ huỷ phần đó, với điều kiện lỗi bị `catch`. Nếu không `catch`, lỗi lan ra ngoài và cả khối ngoài cũng `rollback`.
- API trả `500` ở cả `khong-bao` và `co-bao`. Khác biệt chỉ thấy ở DB và log SQL.

## Câu hỏi về 2 ORM instance (HANDOFF mục 2)

Đã kiểm chứng: dù `runInTransaction` dùng instance thứ hai, `insert` của `UserRepository` vẫn nằm trong cùng transaction (rollback và savepoint đều đúng).
