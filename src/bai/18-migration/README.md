# Bài 18 — Migration *(đang học: xong 18A–D, còn 18E)*

## Chỉ cần nhớ

- `orm.schema.getUpdateSchemaSQL()` so **metadata entity** với **DB thật** (đọc bằng `pragma table_info`, ...) → trả về chuỗi SQL, chưa chạy. `orm.schema.update()` = sinh xong **chạy luôn**.
- ORM chỉ thấy **cấu trúc**, không thấy **dữ liệu**. Thêm cột `not null` vào bảng đã có dòng → DB chặn: *"Cannot add a NOT NULL column with default value NULL"*. Sửa: `@Property({ default: '' })` hoặc nullable rồi backfill.
- Đổi tên property: ORM **đoán** rename (`SchemaComparator.detectColumnRenamings`): cột mới chỉ có **đúng 1** cột mất cùng kiểu/null/FK → `rename column`. Mơ hồ (≥ 2 ứng viên, ví dụ đổi tên 2 cột `text` cùng lúc) → `drop` + `add` → **mất dữ liệu, không báo lỗi**.
- → **Không bao giờ chạy `schema.update()` lên production.**
- `orm.migrator.create()` sinh SQL y hệt, nhưng **ghi ra file** `src/migrations/MigrationXXXX.ts` và **không đụng DB**. File có `up()` (lên bản mới) và `down()` (quay về). Con người đọc + sửa file trước khi chạy.

## Kết quả đã chạy

- 18A: DB cũ `khach_hang(id, name)` có 3 dòng, entity thêm `email` → `add column email text not null` → lỗi. Thêm `default: ''` → thành công, 3 dòng có `email = ''`.
- 18B: DB `ho_ten`, entity `name` → `rename column ho_ten to name`, dữ liệu còn.
- 18C: đổi tên 2 cột (`ho_ten→name`, `sdt→phone`) → 2 `drop` + 2 `add`, chạy êm, 3 dòng thành `null`.
- 18D: `migrator.create()` → file migration chứa đúng 4 câu drop/add, DB vẫn nguyên.

## Học tiếp từ đây

1. Mở `src/migrations/Migration....ts`, thay 4 dòng trong `up()` bằng 2 câu `rename column ho_ten to name` / `rename column sdt to phone`.
2. 18E: chạy `orm.migrator.up()` lên DB cũ → dữ liệu còn không? Xem bảng `mikro_orm_migrations`.
3. Sau đó: chạy `up()` lần 2 (không chạy lại), `down()`, `snapshot`, quy trình deploy an toàn.

## Ghi chú kỹ thuật

- Từ bài này **bắt buộc Node 22** (`@mikro-orm/migrations` dùng `fs.globSync`). Đã bỏ `overrides` trong `package.json`, thêm `.nvmrc`.
- Cài `@mikro-orm/migrations@7.1.14` (khớp version core). Config: `extensions: [Migrator]`, `migrations: { path: 'dist/migrations', pathTs: 'src/migrations', snapshot: false }`.
- `snapshot: false` để diff bằng cách đọc DB thật (giống 18A). Mặc định là `true`, chưa học.
- Mỗi lần chạy 18D sinh thêm 1 file mới → xoá `src/migrations` trước khi chạy lại.
- Entity `KhachHang` khai báo ngay trong `main.ts`, không đụng `User`/`Post`/`Comment`.
