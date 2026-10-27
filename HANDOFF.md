# HANDOFF — nhánh `work-form`

Cập nhật: 2026-10-27. Đưa file này (và `WORK-FORM.md`) cho Claude ở phiên mới là đủ để làm tiếp.

## Mục tiêu

Luyện lại 20 bài MikroORM của mikro-lab **theo đúng form backend work** (`/Users/mapclient.001/Work/backend`, repo Mapstudy) để đọc hiểu code BE ngay. Không copy nguyên code công ty: base class viết bản rút gọn cùng chữ ký.

## Quyết định đã chốt

| Việc | Chốt |
|---|---|
| Chỗ làm | Nhánh `work-form` của repo này. `main` giữ nguyên bản v7 + SQLite làm đối chiếu |
| Phiên bản | MikroORM **6.4.12**, `@mikro-orm/nestjs` 6.1.1 (khớp BE) |
| DB | Postgres 16 trong Docker, **cổng 5434**, user/pass/db: `lab`/`lab`/`mikro_lab`, schema `lab` |
| Base class | Viết rút gọn, không dùng `any` (BE dùng nhiều `any`) |
| Node | 20 (`.nvmrc`), BE cũng Node 20 |

## Trạng thái

- Xong: khung chạy được. Tạo/đọc User và Post qua API, log SQL đúng.
- Đã commit và push lên nhánh `work-form` (cuối phiên 2026-10-27).
- Xong bài 8 (`src/bai-work/08-populate-n-plus-1/README.md`): N+1 = 15 query, populate = 3 query.
- Xong bài 10 (`src/bai-work/10-query-builder/README.md`): `qb().execute()` trả object trơn, `GET /lab/bai10/posts-per-user` đã chạy đúng.
- **Bước tiếp theo: bài 11 (Transaction).** Mới giải thích ý chính, chưa viết code. Kế hoạch: 2 endpoint, một cái không bọc, một cái bọc bằng `runInTransaction` (BE: `module/_core/infras/orm/mikro/util.ts`), cả hai ném lỗi ở bước 2 rồi so sánh log `commit` và `rollback`. Ghi chú bài 11 bản v7 ở `src/bai/11-transaction/README.md`.
- Chưa làm: bài 11 trở đi (bước 3 và 5 của `WORK-FORM.md`).
- Cách dạy người dùng muốn: mỗi lượt một ý, bảng nhỏ và một câu chốt, người dùng tự chạy và dán log, không dán log dài.

## Chạy

```bash
docker compose up -d
npm run start:local          # AUTO_GENERATE=true, PORT mặc định 3100
```

`nest start` không `--watch` thì **không tự nạp code mới**, phải dừng và chạy lại. `npm run start:local` có `--watch`.

## Bản đồ file

| Đường dẫn trong `src/` | Vai trò | File tương ứng ở BE (`/Users/mapclient.001/Work/backend/src/`) |
|---|---|---|
| `root/app.module.ts` | Cấu hình ORM, `MikroOrmMiddleware`, `FlushMode.COMMIT` | `root/app.module.ts` |
| `main.ts` | Bootstrap, `ensureDatabase`, `updateSchema` khi `AUTO_GENERATE` | `main.ts` |
| `module/_core/domain/entity/baseEntity.pg.ts` | `serialize`, `getEm`, `persistAndFlush` | cùng đường dẫn |
| `module/_core/domain/repository/base.pg.ts` | CRUD chung, `excludeRelation` | cùng đường dẫn |
| `module/_core/domain/service/base.pg.ts` | Service chung | cùng đường dẫn |
| `module/_core/infras/orm/mikro/util.ts` | `setGlobalORM`, `runInTransaction` (bỏ các `virtual*` của v5) | cùng đường dẫn |
| `module/_core/infras/env/configEnv.ts` | Config qua `registerAs("env")`, inject bằng `envConfig.KEY` | `infras/env/*` (đơn giản hơn) |
| `module/lab/` | Module mẫu: `app/controller`, `domain/{model,repository,service,dto,config}` | `module/order/` làm mẫu layout |

Entity: `User` (name, email hidden, posts hidden), `Post` (title, author, comments hidden, status), `Comment` (title, post).

## Phát hiện về BE (đã kiểm chứng bằng chạy thật)

1. `BaseRepository.create/build` mặc định `excludeRelation = true` → xoá mọi quan hệ khỏi data. Tạo `Post` với `author` phải truyền `{ excludeRelation: false }` (xem `PostService.createWithAuthor`). Không truyền thì lỗi `Value for Post.author is required`.
2. `app.module.ts` gọi `MikroORM.init` lần hai rồi `setGlobalORM` → có 2 ORM instance. `runInTransaction` dùng instance thứ hai. **Chưa kiểm chứng hành vi**, soi ở bài 11.
3. `flushMode: COMMIT` + `persistOnCreate: false` → `em.create` không tự persist, query giữa chừng không tự flush.
4. BE không dùng Filters, không có migrator, không có file test nào. Bài 13, 18, 19 là bản "nếu thêm thì thêm thế nào".

## Việc tiếp theo

1. Thứ tự còn lại: 10, 11, rồi 3, 16, 17, rồi 6, 7, 9, rồi các bài khác.
2. Mỗi bài ghi README ở `src/bai-work/NN-ten-bai/`, kèm "ở BE file nào làm đúng việc này".

## Bẫy môi trường

- Đừng `pkill -f "nest start"`: bị chặn, và có thể giết nhầm server Nest khác của người dùng. Chạy server bằng `run_in_background`, dừng bằng `TaskStop` đúng task ID.
- macOS dùng BSD `sed`: `sed -i '/x/d' file` lỗi. Dùng Edit hoặc python.
- Cổng 3100 có thể còn server cũ (`dist/main`) từ phiên trước: chạy lab bằng `PORT=3101`.
- Cổng 5433 là Postgres của dự án khác (`map-crm-postgres-1`). Lab dùng 5434, đừng đụng.
- `tsconfig.json` không bật `declaration`: bật lên thì `BaseRepository` lỗi TS4053 do kiểu `HiddenProps` của MikroORM.
- Tiêu chí giao tiếp của người dùng: tiếng Việt, ngắn, mỗi lượt một ý, không dùng ①②③, không comment trong code, không `any`.
