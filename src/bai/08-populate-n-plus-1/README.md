# Bài 8 — `populate` và N+1

## Chỉ cần nhớ

- **N+1** = 1 câu lấy danh sách + N câu lấy thứ đi kèm (thường là `load()` hoặc `await` trong vòng `for`).
  3 post → 4 câu. 1000 post → **1001 câu**. Lúc dev ít dữ liệu thì không thấy, lên production mới chậm.
- **Sửa:** `em.find(Post, {}, { populate: ['author'] })` → **1 câu** `inner join user`, dù có bao nhiêu post.
- Có `populate` thì TS cho gõ thẳng `p.author.$.name` (không `await`, không `load()`).
  Bỏ `populate` → `tsc` báo lỗi `Property '$' does not exist`.

## Kết quả đã chạy

| | 3 post | 1000 post |
|---|---|---|
| 8A: `load()` trong `for` | 4 câu | 1001 câu |
| 8B: `populate: ['author']` | 1 câu | 1 câu |

```sql
select p0.*, a1.id, a1.name, a1.email
from post as p0 inner join user as a1 on p0.author_id = a1.id
```

## Vì sao TS biết đã load (8C)

Chuỗi `'author'` trong `populate` được TS đọc như một **kiểu**, không chỉ là giá trị.
Kiểu trả về của `find` đổi thành `Loaded<Post, 'author'>`, trong đó `author` có thêm `.$`.
Không populate → vẫn là `Ref<User>` trơn như bài 7 → không có `.$`.

**Dấu hiệu nhận ra N+1 trong code thật:** `await` bên trong vòng `for` / `map`, mà thứ được `await` là quan hệ.
