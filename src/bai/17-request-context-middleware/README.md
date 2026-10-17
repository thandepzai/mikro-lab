# Bài 17 — `RequestContext` middleware và `@CreateRequestContext()`

## Chỉ cần nhớ

- `MikroOrmModule.forRoot` tự gắn `MikroOrmMiddleware` cho **mọi route HTTP** (tắt bằng `registerRequestContext: false`). Middleware chỉ có 1 dòng: `RequestContext.create(this.orm.em, next)`.
- → Inject `EntityManager` vào controller/service, gọi qua HTTP thì chạy được: mỗi request một bản fork mới, Identity Map chỉ sống trong 1 request (không phải cache giữa các request).
- Code **không đi qua HTTP** (cron, worker queue, `onModuleInit`, event listener) → middleware không chạy → `this.em` là `em` toàn cục → lỗi y hệt 16B.
- Sửa: `@CreateRequestContext()` lên method `async`. Bên trong: lấy `this.em` (hoặc `this.orm`) → `RequestContext.create(em, () => methodGoc())`. Giống middleware, chỉ khác là bọc **một hàm** thay vì **một route**.
- Method có `@CreateRequestContext()` gọi sang service khác (không decorator) → service kia **dùng chung bản fork**, vì context đi theo cả chuỗi `await`.
- Tự `const em = this.em.fork()` thì **không** được như vậy: `fork()` chỉ trả về biến cục bộ, không cất vào context → service khác vẫn dùng `em` toàn cục → lỗi. Muốn dùng `fork()` phải truyền `em` qua tham số từng hàm.
- **Bẫy:** class phải có property tên đúng `em` hoặc `orm` (hoặc truyền callback `@CreateRequestContext(() => ...)`), không thì decorator ném lỗi. Method phải `async`.

## Kết quả đã chạy

- 17A: 2 lần `GET /users/1` → `em.id` = 7, 8 (ngoài = 2), cả 2 lần đều `select`.
- 17B: gọi thẳng `BaoCaoService.demUser()` (giả lập cron) → lỗi *"Using global EntityManager..."*.
- 17C: thêm `@CreateRequestContext()` → chạy được, 2 lần gọi → `em.id` = 7, 8.
- 17D: `BaoCaoService.baoCao()` (có decorator) gọi `PostService.demPost()` (không decorator) → cả hai `em.id = 7`, chạy được.
- 17E: bỏ decorator, tự `fork()` trong `baoCao()` → `baoCao` dùng #7, `PostService` dùng #2 (toàn cục) → lỗi.

## Ghi chú kỹ thuật

- Cài thêm `@nestjs/platform-express` để có HTTP thật. Sandbox dùng `fetch` gọi vào chính server, `npm run dev` là đủ.
- Source đã đọc: `node_modules/@mikro-orm/nestjs/mikro-orm.middleware.js`, `mikro-orm-core.module.js` (`configure`), `node_modules/@mikro-orm/decorators/legacy/CreateRequestContext.js`.
- Chưa đụng: `@EnsureRequestContext()` (dùng lại context có sẵn thay vì tạo mới).
