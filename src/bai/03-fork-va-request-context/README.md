# Bài 3 — `em.fork()` và `RequestContext`

> Học xong 03/09/2026 · [← về lộ trình](../../../README.md#lộ-trình)

**Code:**

- [`bai-03a.ts.bak`](bai-03a.ts.bak)
- [`bai-03b.ts.bak`](bai-03b.ts.bak)

---

**Vấn đề:** hai request dùng chung một `em` thì dùng chung luôn `identityMap` và Unit of Work.

| Dùng chung `em` | Kết quả |
|---|---|
| B `findOne` sau khi A sửa dở | Chỉ 1 câu `select` — B nhận **đúng object A đang sửa** |
| B gọi `flush()` | `begin` + `update` — **B ghi hộ A** |

`flush()` không flush "phần của B". Nó flush **cả Unit of Work**.

→ Hai lỗi cùng lúc: **ghi nhầm** (data A chưa validate xong đã nằm trong DB) và
**đọc nhầm** (B thấy dữ liệu của A — lộ dữ liệu chéo user/tenant).
Chỉ nổ khi hai request chồng nhau về thời gian → test một mình không bao giờ thấy.

**`em.fork()`** = `em` mới, `identityMap` rỗng, ảnh chụp rỗng. Mỗi request một cái. Không có ngoại lệ.

**`RequestContext.create(orm.em, cb)`** = `fork()` tự động + `AsyncLocalStorage`.

Biến `orm.em` **không đổi** — thứ đổi theo context là cái `em` mà method của nó lấy ra dùng.
Nên trong Nest cứ `inject EntityManager` một lần rồi dùng thoải mái.

```ts
// MikroOrmModule tự đăng ký cho mọi HTTP request
app.use((req, res, next) => RequestContext.create(orm.em, next));
```

**Gọi `orm.em` ngoài mọi context → nổ:**

```
ValidationError: Using global EntityManager instance methods for context specific
actions is disallowed. If you need to work with the global instance's identity map,
use `allowGlobalContext` configuration option or `fork()` instead.
```

| Cách sửa | Đánh giá |
|---|---|
| `fork()` / `RequestContext` | ✅ Đúng |
| `allowGlobalContext: true` | ⚠️ **Bẫy.** Tắt chốt an toàn → bug ở trên quay lại nguyên vẹn |

Câu trả lời đầu tiên trên Google luôn là `allowGlobalContext`. Chỉ đúng cho test/script một luồng.

**Chỗ `RequestContext` KHÔNG tự chạy** (không đi qua HTTP middleware) — đúng những chỗ ăn lỗi trên:
`@Cron()`, BullMQ consumer, `@OnEvent()`, websocket gateway, script CLI.
→ Bọc bằng `@CreateRequestContext()`. Chi tiết ở bài 17.
