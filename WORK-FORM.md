# WORK-FORM — Luyện 20 bài MikroORM theo form backend work

Mục tiêu: làm lại 20 bài của mikro-lab **bằng đúng stack, cấu trúc, cách viết của `/Users/mapclient.001/Work/backend`** để vào BE là đọc hiểu code ngay.

## 1. Khác biệt lab vs backend work

| | mikro-lab (hiện tại) | backend work |
|---|---|---|
| MikroORM | v7.1 | **v6.4.12** (`@mikro-orm/nestjs` 6.1.1) |
| DB | SQLite in-memory | **PostgreSQL**, nhiều `schema` (`order`, ...) |
| Tạo bảng | `schema.create` trong `orm.ts` | `AUTO_GENERATE` env + `entities` trong `migration/config.ts` (không có migrator) |
| Flush | mặc định `auto` | **`FlushMode.COMMIT`** |
| Cấu trúc module | phẳng | `module/<tên>/{app/controller, domain/{model,repository,service,dto,config}, infras}` |
| Lớp nền | không có | `BaseEntity`, `BaseRepository<Entity>`, `BaseService<Entity>`, `QueryOption`, `extractFilter` |
| Transaction | `em.transactional` | `runInTransaction(...tasks)` (global ORM) + `transactional` |
| Test | `@nestjs/testing` | **chưa có file spec nào** |
| Config ORM | mặc định | `persistOnCreate: false`, `ignoreUndefinedInQuery`, `autoJoinOneToOneOwner: false`, `getMappedType` (string→Text, number→Double) |

## 2. Bài nào có ngoài đời thật (đếm trong `src/`)

| Bài | Tính năng | Số lần dùng ở BE | Ghi chú |
|---|---|---|---|
| 1–2, 4 | Identity Map / UoW / trạng thái | ngầm | `flush()` 211 chỗ |
| 3, 16, 17 | fork / RequestContext / middleware | `fork()` 19, `RequestContext` 27 | `MikroOrmMiddleware` gắn tay trong `AppModule` |
| 6–7 | ManyToOne / Ref | `Ref<` 7 | v6 dùng `virtualManyToOne` (helper trong `orm/mikro/util.ts`) |
| 8–9 | populate / strategy | `populate(` **492**, `strategy` 8 | trọng tâm |
| 10 | QueryBuilder | `qb(` / `createQueryBuilder` **182** | trọng tâm |
| 11–12 | Transaction / flush order | `runInTransaction` **149**, `transactional` 11 | trọng tâm |
| 13 | Filters | **0** | BE chưa dùng; lọc tay bằng `extractFilter` (`status != DELETED`) |
| 14 | Hooks | 8 | |
| 15 | Serialization | `hidden: true` 42, `serialize()` ở `BaseEntity` | |
| 18 | Migration | **0** | BE dùng `AUTO_GENERATE`; bài này làm kiểu "đọc hiểu + so sánh" |
| 19 | Testing | **0** | chỗ trống để tự thêm |
| 20 | Performance | `cache:` 3 | |

## 3. Đề xuất cấu trúc nhánh `work-form`

```
src/
  base/                       <- chép khung từ BE (BaseEntity, BaseRepository, BaseService, QueryOption)
  module/
    lab/                      <- 1 module mẫu theo form BE (user, post như lab cũ)
      app/controller/
      domain/{model,repository,service,dto,config}/
      infras/
    migration/config.ts       <- danh sách entities như BE
  root/app.module.ts          <- MikroOrmModule.forRootAsync giống BE (Postgres + FlushMode.COMMIT)
docker-compose.yml            <- Postgres local
src/bai-work/NN-ten-bai/      <- mỗi bài: README + code viết bằng BaseRepository/Service
```

## 4. Các bước

1. Đổi lab sang v6.4.12 + Postgres (docker-compose), `app.module.ts` copy cấu hình BE.
2. Chép khung `_core` (BaseEntity/Repository/Service) và dựng 1 module mẫu `lab` theo layout BE.
3. Luyện lại 20 bài theo thứ tự ưu tiên: **8, 10, 11 → 3, 16, 17 → 6, 7, 9 → còn lại**; mỗi bài chạy thành controller + service thật, xem log SQL (`debug: true`).
4. Mỗi bài ghi README: "ở BE file nào làm đúng việc này" (đường dẫn `src/module/...`).
5. Bài 13, 18, 19: làm bản "BE chưa có — nếu thêm thì thêm thế nào".

## 5. Tiến độ

- [x] Bước 1–2: hạ v6.4.12 + Postgres (docker, cổng 5434), `app.module.ts` chép cấu hình BE, khung `_core` rút gọn, module `lab` (User, Post, Comment).
- [ ] Bước 3: luyện 20 bài theo thứ tự 8, 10, 11 → 3, 16, 17 → 6, 7, 9 → còn lại. Xong: bài 8, 10.
- [ ] Bước 5: bài 13, 18, 19.

## 6. Chạy

```bash
docker compose up -d
npm run start:local        # AUTO_GENERATE=true: tự tạo schema "lab" và bảng
curl -XPOST localhost:3100/lab/users -H 'content-type: application/json' -d '{"name":"Than","email":"than@example.com"}'
curl -XPOST localhost:3100/lab/posts -H 'content-type: application/json' -d '{"title":"Bai dau tien","authorId":1}'
```

## 7. Phát hiện khi dựng khung (hành vi thật của BE)

| Phát hiện | Hệ quả |
|---|---|
| `BaseRepository.create/build` mặc định `excludeRelation = true` → xoá mọi quan hệ khỏi data | Tạo `Post` với `author` bằng `create(...)` thường sẽ ném `Value for Post.author is required`. Phải truyền `{ excludeRelation: false }` (xem `PostService.createWithAuthor`) |
| `app.module.ts` gọi `MikroORM.init` lần 2 rồi `setGlobalORM` | Có 2 ORM instance; `runInTransaction` dùng instance thứ 2 → điểm cần soi ở bài 11 |
| `flushMode: COMMIT` + `persistOnCreate: false` | `em.create` không tự persist; query giữa chừng không tự flush → soi ở bài 2, 4 |
| `hidden: true` ở `email`, `posts` | `serialize()` không trả ra (bài 15) |
