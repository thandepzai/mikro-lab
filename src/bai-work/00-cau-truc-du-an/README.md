# Cấu trúc dự án (work-form)

## Ý 1: Một request đi qua những file nào

Ví dụ `curl -X POST localhost:3100/lab/bai11/co-bao`:

| Bước | File | Việc làm |
|---|---|---|
| 1 | `src/main.ts` | Khởi động app, mở cổng 3100 (chỉ chạy 1 lần lúc start) |
| 2 | `src/root/app.module.ts` | `MikroOrmMiddleware`: mỗi request có một `em` riêng |
| 3 | `lab/app/controller/bai11.ts` | Nhận URL, gọi service |
| 4 | `lab/domain/service/bai11.ts` | Logic: transaction, tạo user, ném lỗi |
| 5 | `lab/domain/repository/user.ts` | Nói chuyện với DB: `create`, `find`, `qb` |
| 6 | `lab/domain/model/user.ts` | Mô tả bảng `lab.user` |
| 7 | Postgres (Docker, cổng 5434) | Chạy SQL |

```
curl → Controller → Service → Repository → DB
curl ← Controller ← Service ← Repository ←─┘
```

Mỗi lớp chỉ gọi lớp ngay dưới nó.

## Ý 1b: `main.ts` giống mở cửa hàng buổi sáng

| Bước | Code | Giống như |
|---|---|---|
| 1 | `NestFactory.create(AppModule)` | Dựng cửa hàng, nhân viên vào chỗ (controller, service, repository) |
| 2 | `ensureDatabase()` + `updateSchema()` | Kiểm tra kho, thiếu kệ (bảng) thì đóng thêm |
| 3 | `useGlobalPipes(ValidationPipe)` | Kiểm tra dữ liệu request (`transform: true` đổi `"5"` thành `5`) |
| 4 | `app.listen(3100)` | Mở cửa, `curl` gọi được từ đây |

Chạy 1 lần khi start. Mỗi `curl` đi thẳng vào controller, không chạy lại `main.ts`.

## Bước 2 của `main.ts`: Schema

Postgres là cái tủ: **database** `mikro_lab` là ngăn tủ, **bảng** `user`/`post`/`comment` là hộp trong ngăn.

| Dòng code | Câu hỏi | Nếu "không" thì |
|---|---|---|
| `getSchemaGenerator()` | (lấy "phòng cấu trúc DB" của MikroORM) | |
| `ensureDatabase()` | Có ngăn `mikro_lab` chưa? | Tạo ngăn |
| `if (autoGenerate)` | Có cờ `AUTO_GENERATE=true` không? | Dừng |
| `updateSchema()` | Đủ hộp như model mô tả chưa? | Tạo hộp/cột thiếu |

Cách `updateSchema` kiểm tra: lấy danh sách cột từ model, hỏi Postgres bảng đang có gì (`select ... information_schema`), so sánh, sinh `create table` / `alter table add column` cho phần thiếu.

- `safe: true`: không bao giờ xoá bảng/cột (xoá property khỏi model thì cột vẫn còn).
- `wrap: false`: không bọc `begin`/`commit`.
- Chạy `npm run start` không có cờ trên DB trống → lỗi `relation "lab.user" does not exist`.

### `getSchemaGenerator` là gì

MikroORM có nhiều "phòng ban":

| Gọi | Lấy ra | Làm việc với |
|---|---|---|
| `orm.em` | EntityManager | **Dữ liệu** (thêm/sửa/xoá/tìm) |
| `orm.getSchemaGenerator()` | SchemaGenerator | **Cấu trúc** (bảng, cột) |
| `orm.getMigrator()` | Migrator | File migration |

## Tự tìm hàm, không cần thuộc

1. Chép theo BE: `backend/src/main.ts` dòng 25 dùng `getSchemaGenerator().ensureDatabase()`. BE dùng `getUpdateSchemaSQL` (chỉ in SQL), dòng `updateSchema` đang bị comment.
2. Docs MikroORM: trang "Schema Generator".
3. VS Code: gõ `generator.` để xem gợi ý, hoặc `Cmd + click` để mở `node_modules/@mikro-orm/knex/schema/SqlSchemaGenerator.d.ts`.

| Biết điều gì | Xem ở đâu |
|---|---|
| Cổng server 3100 | `_core/infras/env/configEnv.ts` |
| Postgres 5434, user/pass `lab` | `docker-compose.yml` |
| URL API | `@Controller(...)` + `@Post(...)` trong controller |
| SQL đang chạy | `debug: true` ở `app.module.ts`, xem log server |

## Ý 2: Nest tự `new` và lắp các lớp (DI)

Nest giữ một `Map`: key là class (hoặc chuỗi), value là object đã `new`. Lúc `NestFactory.create` nó đi từ dưới lên:

```ts
container.set(EntityManager, em);
container.set(UserRepository, new UserRepository(container.get(EntityManager)));
container.set(Bai11Service, new Bai11Service(container.get(UserRepository)));
```

| Mảnh | Việc làm |
|---|---|
| Kiểu tham số constructor | Key để tra trong `Map` ("tôi cần gì") |
| `providers` | Những class Nest được phép `new` ("có những gì") |
| `exports` + `imports` | Cho module khác dùng ké provider |
| `forFeature([User])` | Bỏ `em.getRepository(User)` vào `Map` với key `"UserRepository"` |
| `@InjectRepository(User)` | Nhãn: tra key `"UserRepository"` (vì `EntityRepository<User>` mất `<User>` khi chạy) |

Lab và BE inject thẳng `EntityManager` (có sẵn toàn app nhờ `forRoot`) rồi `super(em, User)` tự gọi `em.getRepository(User)` → về lý thuyết không cần `forFeature`. **Chưa chạy thử bỏ `forFeature`.**

Câu chốt: decorator chỉ là nhãn, Nest đọc nhãn để biết lấy gì trong `Map`.

## Học tiếp

- ~~Ý 2~~ xong. Thí nghiệm còn treo: bỏ `forFeature` xem app có start không; xoá `Bai11Service` khỏi `providers` xem lỗi lúc start hay lúc gọi.
- Ý 3: `app.module.ts` — cấu hình ORM, `MikroOrmMiddleware`, 2 ORM instance.
