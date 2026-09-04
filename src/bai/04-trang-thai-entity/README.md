# Bài 4 — 4 trạng thái của entity

> Học xong 04/09/2026 · [← về lộ trình](../../../README.md#lộ-trình)

**Code:**

- [`bai-04a.ts.bak`](bai-04a.ts.bak)
- [`bai-04b.ts.bak`](bai-04b.ts.bak)
- [`bai-04c.ts.bak`](bai-04c.ts.bak)

---

Mô hình `Map` / `Set` của `em`: xem [`em` thực chất là cái gì](../../../README.md#em-thực-chất-là-cái-gì) ở README gốc.

**Vòng đời một entity:**

```
new User()  --persist()-->  [persistStack]  --flush()-->  MANAGED
                                                             |
                                                          remove()
                                                             v
                                                         REMOVED
                                                             |
                                                          flush()  (delete)
                                                             v
                                                         DETACHED
```

**Không hàm nào trong `persist` / `remove` / `merge` sinh ra SQL.** Chỉ ghi vào sổ, `flush` mới đi làm.

| | Ý nghĩa | Sinh SQL lúc gọi |
|---|---|---|
| `persist` | "object này là **mới**, đi INSERT" | Không |
| `remove` | "object này đi DELETE" | Không |
| `merge` | "object này **đã có sẵn** trong DB, quản lại đi" | Không |

**Ai cấp `id`?** DB, không phải MikroORM. Bằng chứng nằm trong chính câu SQL:

```sql
insert into `user` (`name`, `email`) values (...) returning `id`
```

Không gửi cột `id` đi, và `returning id` để lấy về. DB sinh (`autoincrement`), MikroORM gán
ngược vào `u.id`. → Đó là lý do trước `flush()` thì `u.id === undefined`.

**Vì sao bài 2 không cần `persist`?** Object load từ DB đã nằm sẵn trong `identityMap` + có ảnh
chụp `original` → `flush` tự so ra chỗ khác. `new User()` không có gì để so, không `persist`
thì `flush` không biết nó tồn tại.

## `persist()` trên một object đã `DETACHED`

**Ảnh chụp gốc nằm trên chính object entity, không phải chỉ trong `em`.** `em.clear()` dọn các
`Map` của `em` nhưng **không đụng** vào ảnh chụp gắn trên object. Nên object detached vẫn tự
mang theo bằng chứng *"tao từ DB ra, tao không mới"*.

→ Hệ quả: `persist()` một object như vậy **không bao giờ INSERT**, và **không hỏi DB câu nào**
(cả 3 kịch bản dưới đây đều 0 câu `select`). Nó nhìn cái cờ trên object là biết.

Kết quả thật, đã chạy:

| Sau `em.clear()` | SQL sinh ra | Trạng thái sau `flush` |
|---|---|---|
| `persist` → `flush` (chưa sửa gì) | không có gì | `DETACHED` — **sửa sau đó cũng vô hiệu** |
| sửa → `persist` → `flush` | `update` `[1 row affected]` | `DETACHED` — ghi đúng **một phát** rồi buông |
| `merge` → sửa → `flush` | `update` `[1 row affected]` | `MANAGED` — quản lại thật sự |

> **`persist` trên detached là phát một lần** — ghi cái diff đang có tại đúng thời điểm `flush`
> rồi thả tay, không đưa object trở lại `identityMap`. **`merge` mới là gắn lại.**

Dòng 1 là bug bài 2: không exception, log sạch, DB không đổi.

**Còn detached kiểu khác thì `persist` lại INSERT:**

| Vào detached bằng | Row trong DB | `persist()` + `flush()` |
|---|---|---|
| `em.clear()` | vẫn còn | không bao giờ insert (bảng trên) |
| `remove()` + `flush()` | đã bị xoá | `insert` **kèm cột `id`** (id do `u.id` quyết, không phải DB) |

Vì `remove()` + `flush()` đã gỡ cờ "tao từ DB ra" khỏi object → nó thành `NEW` trở lại.

## `merge()`

```ts
em.clear();
em.merge(u);              // -> MANAGED ngay. 0 câu SQL.
u.name = 'Doi sau merge';
await em.flush();         // -> update ... [1 row affected]
```

`merge` nói *"object này tao đảm bảo đã có row trong DB"* — và `em` **tin luôn, không kiểm tra**.
Nạp thẳng vào `identityMap` + `original`.

→ Mặt trái: merge một object mà row đã bị xoá thật thì `flush` vẫn sinh `update`, và log ghi
`[0 rows affected]`. Không exception, không cảnh báo. **Câu lệnh rơi vào khoảng không.**

> Khi debug MikroORM, `[N rows affected]` ở cuối dòng log quan trọng ngang câu SQL.
