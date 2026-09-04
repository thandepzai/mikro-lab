# Bài 1 — Identity Map

> Học xong 02/09/2026 · [← về lộ trình](../../../README.md#lộ-trình)

**Code:**

- [`bai-01.ts.bak`](bai-01.ts.bak)

---

`em` giữ một cái `Map`, **key là khoá chính**. Trong một `em`, mỗi dòng trong DB
chỉ tồn tại **duy nhất một object** trong RAM.

```js
em.identityMap = new Map([ ['User-1', <object user #1>] ]);
```

| Tìm bằng | Tránh được SQL? | Trả về cùng object? |
|---|---|---|
| khoá chính | ✅ | ✅ |
| field khác | ❌ | ✅ vẫn cùng |

Tìm bằng field khác vẫn phải chạy SQL (vì chưa biết ra row nào), nhưng khi DB trả row về
nó nhìn `id`, thấy đã có trong Map thì **vứt row mới đi**, trả lại object cũ.

→ Hệ quả: **dữ liệu trong RAM luôn thắng dữ liệu vừa lấy từ DB.**

**Bài tập đã làm:**
- Chèn `em.clear()` vào giữa 2 lần `findOne` → `false`, 2 câu SQL
- `findOne(User, { name: 'Than' })` sau `findOne(User, 1)` → vẫn `true`, nhưng 2 câu SQL
