# Bài 2 — Unit of Work

> Học xong 02/09/2026 · [← về lộ trình](../../../README.md#lộ-trình)

**Code:**

- [`bai-02.ts.bak`](bai-02.ts.bak)

---

Không cần `persist` / `update` / `save`. Chỉ gán property JS bình thường rồi `flush()`.

> **`flush()` = so object hiện tại với ảnh chụp lúc load, khác thì ghi.**

`em` giữ **hai** thứ, không phải một:

```js
em = {
  identityMap: new Map(),   // đang giữ những object nào
  original:    new Map(),   // ảnh chụp lúc mới load: { 1: { name: 'Than' } }
}
```

> ⚠️ **Đính chính ở bài 4:** `original` không nằm trong `em`. Nó được gắn thẳng lên chính object
> entity (`__originalEntityData`), nên nó **sống sót qua `em.clear()`**. Xem
> [`em` thực chất là cái gì](../../../README.md#em-thực-chất-là-cái-gì). Phần còn lại của bài 2 vẫn đúng.

**Bài tập đã làm:**

| Thí nghiệm | Kết quả | Vì sao |
|---|---|---|
| Gán lại đúng giá trị cũ | Không có `begin` | So ra giống hệt → không ghi |
| Gọi `flush()` hai lần | Lần hai không sinh gì | Lần đầu ghi xong đã cập nhật lại ảnh chụp |
| `em.clear()` trước `flush()` | Mất luôn `update` | Không còn object nào để so |

**Điểm quan trọng nhất của bài 2:** `em.clear()` **không** reset giá trị.
Object vẫn giữ giá trị mới trong RAM — thứ bị mất là quan hệ *"đang được ORM quản lý"*:
**managed → detached**.

```
>> Object trong RAM  : Ten moi     <-- vẫn đổi
>> Giá trị trong DB  : Than        <-- không đổi
>> u === check ?      false
```

→ Đây là loại bug tệ nhất: **âm thầm**. Không exception, API trả `200 OK`, mà DB không đổi.
Nếu gặp cảnh "gọi API không lỗi gì mà data không lưu" → 90% là entity đã bị detached.
