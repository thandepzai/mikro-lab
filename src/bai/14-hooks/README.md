# Bài 14 — Hooks

## Chỉ cần nhớ

- Hook = method trong entity, gắn decorator (`@BeforeCreate()`, `@BeforeUpdate()`...), MikroORM tự gọi đúng lúc.
- Thứ tự trong log: `begin` → hook chạy → `insert`/`update` → `commit`. Hook chạy **trước khi** MikroORM dựng câu SQL, nên giá trị hook gán đi luôn vào câu đó, không cần `update` phụ.
- Mỗi hook chỉ chạy đúng thời điểm của nó: `@BeforeCreate` chỉ lúc tạo mới, sửa về sau không chạy lại → `createdAt` không bao giờ bị đổi.
- Audit field đầy đủ = `@BeforeCreate` cho `createdAt` + `@BeforeUpdate` cho `updatedAt`.

## Bẫy: `?` của TypeScript ≠ `nullable` của DB

- `updatedAt?: Date` chỉ nói với **TypeScript** là field không bắt buộc (để `em.create()` không đòi truyền).
- Cột trong DB do `@Property()` quyết định, mặc định **NOT NULL**. Lúc tạo mới chưa có ai gán `updatedAt` → lỗi
  `Value for Comment.updatedAt is required, 'undefined' found`.
- Sửa: `@Property({ nullable: true })`. Hai chỗ này độc lập nhau.
- `createdAt` không lỗi dù cũng NOT NULL, vì hook đã gán trước lúc MikroORM kiểm tra.

## Kết quả đã chạy

- Tạo comment không set `createdAt` → log hook nằm giữa `begin` và `insert`; `createdAt` có giá trị sau flush.
- Sửa `title` rồi flush → `@BeforeUpdate` chạy, `updatedAt` có giá trị, `createdAt` giữ nguyên.

## Chưa học

- **EventSubscriber**: một class lắng nghe `beforeCreate`/`beforeUpdate`... dùng chung cho mọi entity, khỏi copy hook vào từng entity. Để dành, quay lại khi cần.

## Ghi chú kỹ thuật

- Entity `Comment` giữ lại `createdAt`, `updatedAt` và 2 hook cho các bài sau (đã bỏ dòng `console.log` trong hook cho đỡ rối log). Bản có log nằm ở `Comment-bai-14.ts.bak`.
- Decorator hook import từ `@mikro-orm/decorators/legacy` (v7), cùng chỗ với `Entity`, `Property`.
