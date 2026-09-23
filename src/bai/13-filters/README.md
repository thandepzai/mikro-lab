# Bài 13 — Filters

## Chỉ cần nhớ

- `em.addFilter({ name, cond, entity })` — **một object**, không phải nhiều tham số rời. `cond` là điều kiện sẽ tự động chèn vào `WHERE` của **mọi** `find`/`findOne` cho entity đó, khỏi phải tự lặp lại ở từng chỗ gọi.
- Mặc định filter **luôn bật** (`default` ngầm định `true`). Muốn tắt tạm ở một lần gọi cụ thể: `em.find(Entity, {}, { filters: false })`.
- Soft delete và multi-tenant chỉ là hai cách dùng chung một cơ chế này: soft delete → `cond: { deletedAt: null }`; multi-tenant → `cond: { tenantId: ... }`.
- `cond` có thể là **hàm** thay vì object cố định: `cond: (args) => ({ author: args.authorId })` kèm `args: true`. Khi đó mỗi lần gọi `find` truyền tham số riêng: `{ filters: { tenFilter: { authorId: 2 } } }` — cùng một filter đăng ký một lần, nhưng lọc khác nhau theo từng lần gọi. Đây là cách dùng thật cho multi-tenant: `authorId`/`tenantId` lấy từ request hiện tại, không hardcode lúc đăng ký filter.

## Kết quả đã chạy

- Filter cố định `{ author: 1 }` trên `Post`: `find(Post, {})` (không truyền where) → chỉ 1 bài (của Than). `find(Post, {}, { filters: false })` → cả 3 bài.
- Filter dạng hàm `theoTacGia`: gọi với `authorId: 2` → chỉ bài của An; gọi với `authorId: 3` → chỉ bài của Binh. Cùng một filter, tham số khác nhau mỗi lần gọi.
