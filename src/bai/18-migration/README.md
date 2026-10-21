# Bài 18 — Migration *(xong 18A–G + review; bài tập lớn: [00d](../00d-bai-tap-lon-bai-18/))*

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
- `snapshot: true` (mặc định): `create()` so entity với file `.snapshot-<db>.json` (sổ ghi *"chạy hết các file migration đã viết thì DB sẽ trông thế này"*), **không đọc DB**. Chỉ lần đầu chưa có sổ mới đọc DB. Mỗi lần `create()` ghi đè sổ.
- Vì sao: DB local không biết về các file đã viết mà chưa `up()`. `snapshot: false` → `create()` lần 2 lại sinh `create table` → 2 file trùng, deploy nổ file thứ 2. Snapshot → so với *những gì các file đã hứa*, ai chạy cũng ra giống nhau.
- Review `up()`: thấy `drop` hoặc `not null` → hỏi *"dữ liệu cũ ra sao?"*. Sửa `up()` thì phải sửa `down()` theo. Thử `up → down → up` trên DB **có dữ liệu** rồi mới commit (file + snapshot + entity cùng lúc).
- `down()` không phải nút Undo thần kỳ — chỉ chạy đúng SQL đang viết trong `down()`. Bản tự sinh là drop/add → quay lui cũng mất dữ liệu. **Review phải đọc cả `up()` lẫn `down()`.**

## Kết quả đã chạy

- 18A: DB cũ `khach_hang(id, name)` có 3 dòng, entity thêm `email` → `add column email text not null` → lỗi. Thêm `default: ''` → thành công, 3 dòng có `email = ''`.
- 18B: DB `ho_ten`, entity `name` → `rename column ho_ten to name`, dữ liệu còn.
- 18C: đổi tên 2 cột (`ho_ten→name`, `sdt→phone`) → 2 `drop` + 2 `add`, chạy êm, 3 dòng thành `null`.
- 18D: `migrator.create()` → file migration chứa đúng 4 câu drop/add, DB vẫn nguyên.
- 18F: `snapshot: true`, DB trống, gọi `create()` 2 lần. Lần 1 đọc DB → `create table` + sinh `.snapshot-memory.json`. Lần 2 không có câu đọc DB nào → `diff` rỗng, dù DB vẫn không có `khach_hang`.
- 18F đối chứng (`snapshot: false`, entity sáng `name` → chiều thêm `phone`, chưa `up()` ở giữa): 2 file đều `create table khach_hang`. `migrator.up()` lên DB trống: `begin` → file A `savepoint` + `create table` + ghi sổ → file B `create table` → *"table `khach_hang` already exists"* → `rollback to savepoint` + `rollback` → **cả file A cũng bị huỷ**: server không có bảng `khach_hang`, sổ `mikro_orm_migrations` rỗng. Bật snapshot → file B là `add column phone`, `up()` chạy êm.
- 18F xoá sổ (`snapshot: true`): sáng `create()` → file A + sổ. Xoá `.snapshot-memory.json`. Chiều `create()` → không có sổ → đọc DB local (chưa `up`) → lại `create table` → **lỗi y hệt `snapshot: false`**, rồi ghi sổ mới. Xoá sổ chỉ an toàn khi DB local đã `up()` hết các file.
- 18F cơ chế `snapshot: true` (đọc `Migrator.create()` trong `node_modules/@mikro-orm/migrations/Migrator.js`): có sổ → `offline` (không kết nối đọc DB) → `fromSchema = sổ` → so với entity → diff rỗng thì **không sinh file, không ghi sổ**; có diff thì sinh file + `storeCurrentSchema()` ghi đè sổ = entity hiện tại. Chạy thật: sáng (chưa sổ, đọc DB) → `create table`, sổ `(id, name)`; chiều (không câu query nào) → `add column phone`, sổ `(id, name, phone)`; tối không sửa → `diff.up: []`, không file. Deploy `up()` 2 file → OK cả 2, `commit`. Sau `up()` Migrator đọc lại DB, chỉ ghi đè sổ nếu DB khác sổ.
- 18G server tự `up()` lúc khởi động (DB file `server-18g.sqlite`, giữ lại giữa các lần): lần 1 (deploy v1: 2 file) → chạy cả 2, cột `id, name, phone`. Lần 2 (không có file mới) → pending `[]`, `up()` không chạy gì, dữ liệu cũ còn. Deploy v2 (thêm file `add email`) → lần 3 chỉ chạy đúng file mới, dữ liệu 2 khách cũ còn, có thêm cột `email = null`. Server tự sinh `.snapshot-server-18g.sqlite.json` sau `up()` — không quan trọng, sổ của server là bảng `mikro_orm_migrations`.
- 18G NestJS (`bai-18g.ts.bak`): DB đứng ở v1 (`id, name, phone`), code mới có `email`. Quên `up()` → `GET /khach/them` trả 500 *"table khach_hang has no column named email"*. Có `await app.get(MikroORM).migrator.up()` trước `app.listen()` → `up()` chạy file C, cột đủ, trả 200.
- 18E: sửa tay `up()`/`down()` thành 2 câu `rename` → `up()` chạy 2 rename + insert tên vào `mikro_orm_migrations`, dữ liệu còn nguyên. `up()` lần 2 → `[]`. `down()` → rename ngược + delete khỏi sổ, dữ liệu về `ho_ten`/`sdt`, file pending lại.

## Học tiếp từ đây

1. Kiểm tra 18F: thêm `email` vào entity, giữ nguyên snapshot cũ → `create()` sinh `add column email` (không `create table`), dù DB trống.
2. Quy trình deploy an toàn: `create` → review `up` + `down` → commit → server chạy `up()` lúc khởi động. *(xong 21/10/2026)*

## Ghi chú kỹ thuật

- Từ bài này **bắt buộc Node 22** (`@mikro-orm/migrations` dùng `fs.globSync`). Đã bỏ `overrides` trong `package.json`, thêm `.nvmrc`.
- Cài `@mikro-orm/migrations@7.1.14` (khớp version core). Config: `extensions: [Migrator]`, `migrations: { path: 'dist/migrations', pathTs: 'src/migrations', snapshot: false }`.
- 18A–E dùng `snapshot: false` để diff bằng cách đọc DB thật. Từ 18F bỏ dòng đó (về mặc định `true`).
- Mỗi lần chạy 18D sinh thêm 1 file mới → xoá `src/migrations` trước khi chạy lại.
- `src/migrations/Migration20261017094903.ts` hiện là bản **đã sửa** (rename) dùng cho 18E. Chạy lại 18D sẽ sinh thêm file drop/add → `up()` chạy cả 2 file, file thứ 2 lỗi vì cột đã đổi tên. Muốn xem lại 18D thì xoá file mới sinh sau khi xem.
- DB `:memory:` → mỗi lần `npm run dev` là DB mới, sổ `mikro_orm_migrations` rỗng, nên `up()` lần đầu trong mỗi lần chạy luôn chạy file. DB thật thì sổ giữ lại giữa các lần.
- Entity `KhachHang` khai báo ngay trong `main.ts`, không đụng `User`/`Post`/`Comment`.
- `up()` chạy qua ORM của Nest không in `[migrator] Processing/Applied`: `@mikro-orm/nestjs` gán logger của ORM = `Logger` của Nest (`mikro-orm.providers.js:16`), mà bootstrap để `logger: ['error']` → log thường bị ẩn. Muốn thấy: `logger: ['error', 'log']`.
- Đọc log lỗi 500: tìm dòng `ERROR [ExceptionsHandler]` đầu tiên. *"no column named X"* → gần như chắc chắn quên chạy migration. Khách chỉ nhận `Internal server error`, lỗi thật chỉ có trong log server.
