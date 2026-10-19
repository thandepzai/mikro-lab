# Bài 18 — Migration *(đang học: xong 18A–E, còn snapshot + quy trình deploy)*

## Chỉ cần nhớ

- `orm.schema.getUpdateSchemaSQL()` so **metadata entity** với **DB thật** (đọc bằng `pragma table_info`, ...) → trả về chuỗi SQL, chưa chạy. `orm.schema.update()` = sinh xong **chạy luôn**.
- ORM chỉ thấy **cấu trúc**, không thấy **dữ liệu**. Thêm cột `not null` vào bảng đã có dòng → DB chặn: *"Cannot add a NOT NULL column with default value NULL"*. Sửa: `@Property({ default: '' })` hoặc nullable rồi backfill.
- Đổi tên property: ORM **đoán** rename (`SchemaComparator.detectColumnRenamings`): cột mới chỉ có **đúng 1** cột mất cùng kiểu/null/FK → `rename column`. Mơ hồ (≥ 2 ứng viên, ví dụ đổi tên 2 cột `text` cùng lúc) → `drop` + `add` → **mất dữ liệu, không báo lỗi**.
- → **Không bao giờ chạy `schema.update()` lên production.**
- `orm.migrator.create()` sinh SQL y hệt, nhưng **ghi ra file** `src/migrations/MigrationXXXX.ts` và **không đụng DB**. File có `up()` (lên bản mới) và `down()` (quay về). Con người đọc + sửa file trước khi chạy.
- File migration **không phải log** — là kịch bản sẽ được chạy. Sửa file = đổi cái sẽ chạy lên DB. `this.addSql()` chỉ xếp hàng, chưa chạy (giống `persist`).
- `orm.migrator.up()`: chạy `up()` của mọi file pending trong `begin...commit`, chạy xong ghi tên file vào bảng `mikro_orm_migrations` (tự tạo nếu chưa có). Gọi lại → đọc sổ, thấy đã chạy → bỏ qua, không chạy gì.
- `pending` = file trong `dist/migrations` **trừ** tên có trong `mikro_orm_migrations`. Không có cột trạng thái "done".
- `orm.migrator.down()`: chạy `down()` của **1 file** chạy gần nhất, rồi **xoá** dòng của nó khỏi sổ → file thành pending lại.
- `down()` không phải nút Undo thần kỳ — chỉ chạy đúng SQL đang viết trong `down()`. Bản tự sinh là drop/add → quay lui cũng mất dữ liệu. **Review phải đọc cả `up()` lẫn `down()`.**

## Kết quả đã chạy

- 18A: DB cũ `khach_hang(id, name)` có 3 dòng, entity thêm `email` → `add column email text not null` → lỗi. Thêm `default: ''` → thành công, 3 dòng có `email = ''`.
- 18B: DB `ho_ten`, entity `name` → `rename column ho_ten to name`, dữ liệu còn.
- 18C: đổi tên 2 cột (`ho_ten→name`, `sdt→phone`) → 2 `drop` + 2 `add`, chạy êm, 3 dòng thành `null`.
- 18D: `migrator.create()` → file migration chứa đúng 4 câu drop/add, DB vẫn nguyên.
- 18E: sửa tay `up()`/`down()` thành 2 câu `rename` → `up()` chạy 2 rename + insert tên vào `mikro_orm_migrations`, dữ liệu còn nguyên. `up()` lần 2 → `[]`. `down()` → rename ngược + delete khỏi sổ, dữ liệu về `ho_ten`/`sdt`, file pending lại.

## Học tiếp từ đây

1. `snapshot: true` (mặc định): ORM so entity với file snapshot thay vì đọc DB thật — vì sao?
2. Quy trình deploy an toàn: `create` → review `up` + `down` → commit → server chạy `up()` lúc khởi động.

## Ghi chú kỹ thuật

- Từ bài này **bắt buộc Node 22** (`@mikro-orm/migrations` dùng `fs.globSync`). Đã bỏ `overrides` trong `package.json`, thêm `.nvmrc`.
- Cài `@mikro-orm/migrations@7.1.14` (khớp version core). Config: `extensions: [Migrator]`, `migrations: { path: 'dist/migrations', pathTs: 'src/migrations', snapshot: false }`.
- `snapshot: false` để diff bằng cách đọc DB thật (giống 18A). Mặc định là `true`, chưa học.
- Mỗi lần chạy 18D sinh thêm 1 file mới → xoá `src/migrations` trước khi chạy lại.
- `src/migrations/Migration20261017094903.ts` hiện là bản **đã sửa** (rename) dùng cho 18E. Chạy lại 18D sẽ sinh thêm file drop/add → `up()` chạy cả 2 file, file thứ 2 lỗi vì cột đã đổi tên. Muốn xem lại 18D thì xoá file mới sinh sau khi xem.
- DB `:memory:` → mỗi lần `npm run dev` là DB mới, sổ `mikro_orm_migrations` rỗng, nên `up()` lần đầu trong mỗi lần chạy luôn chạy file. DB thật thì sổ giữ lại giữa các lần.
- Entity `KhachHang` khai báo ngay trong `main.ts`, không đụng `User`/`Post`/`Comment`.
