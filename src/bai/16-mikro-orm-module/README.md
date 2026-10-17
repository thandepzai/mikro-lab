# Bài 16 — `MikroOrmModule`

## Chỉ cần nhớ

- `@Module({...})` là **decorator** (TS, cùng loại `@Entity`): `Module({...})(AppModule)` — dán nhãn config lên class rỗng.
- `MikroOrmModule.forRoot({...})` chỉ là nơi ghi config. `NestFactory` mới gọi `MikroORM.init()` lúc khởi động app, rồi cất `orm` vào **DI container** (một cái `Map` class → instance). `app.get(X)` = lấy ra.
- Phải ghi `driver: SqliteDriver` vì `@mikro-orm/nestjs` dùng chung mọi DB (khác `@mikro-orm/sqlite` đã gắn sẵn driver).
- `EntityManager` mà Nest inject **chính là `orm.em` toàn cục**. Gọi `findOne` trên nó ngoài request → lỗi *"Using global EntityManager... is disallowed"*. Lý do: chung một Identity Map + một Unit of Work → request này `flush` hộ thay đổi request kia đã bỏ.
- Đặt cùng biến `em` vào `RequestContext.create(em, fn)` → chạy được, `em.id` đổi. `em` toàn cục là **cái vỏ chuyển tiếp**: mỗi hàm gọi `getContext()` trước, trong request thì chuyển sang bản fork cất trong `AsyncLocalStorage`.

## Kết quả đã chạy

- 16A: `[info]` + `[discovery]` nằm giữa `SAP GOI NestFactory` và `NestFactory XONG`.
- 16B: `em === orm.em` → `true`; `findOne` ném lỗi, không có `select`.
- 16C: ngoài `em.id = 2`, trong `em.id = 7`; có `select`, ra `Than`.
- 16D: `em1`, `em2` = 2 bản fork của `orm.em`. Cùng `findOne(User, 1)`: 2 câu `select`, `u1 === u2` → `false`. `em1` đọc lại → không `select`, `u1 === u1LanHai` → `true`. → `fork()` = em mới với **Identity Map + sổ riêng**.

## Ghi chú kỹ thuật

- `orm.ts` tách `taoBangVaSeed(orm)` ra để dùng với ORM do Nest tạo.
- Sandbox dùng `createApplicationContext` (chỉ DI, không HTTP). App thật dùng `NestFactory.create` + `listen`.
- Chưa chạy thử: middleware tự bọc mỗi HTTP request vào `RequestContext` → để bài 17.
