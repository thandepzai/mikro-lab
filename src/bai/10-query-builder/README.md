# Bài 10 — QueryBuilder

## Chỉ cần nhớ

- QB = viết SQL bằng hàm JS nối chấm. Dùng khi `em.find` không diễn đạt được: `count`, `sum`, `group by`...
- Các hàm `.select()` / `.leftJoin()` / `.groupBy()` **chỉ ghi dần các mảnh**, chưa chạy. Chạy thật ở hàm cuối.
- **Hàm cuối quyết định bạn nhận được gì:**

| Kết thúc bằng | Nhận về | Nằm trong sổ? | Sửa xong `flush()` |
|---|---|---|---|
| `.execute()` | object JS trơn, đúng các cột đã `select` | không | **bị bỏ qua âm thầm** |
| `.getResultList()` | entity `User` thật | có | sinh `update` như bài 2 |

- **Quy tắc:** cần *con số / báo cáo* → `execute()`. Cần *entity để sửa* → `getResultList()` (hoặc quay về `em.find`).

## `raw(...)`

Đưa nguyên văn vào SQL, QB không xử lý (giống `innerHTML` so với `textContent`).
- Trong `raw` phải viết **tên cột thật** (`author_id`), không phải tên field (`author`).
- **Không bao giờ** nhét dữ liệu người dùng vào `raw` → SQL injection. Chỉ dùng cho hàm SQL viết cố định (`count`, `sum`...).

## Kết quả đã chạy

- **10A:** mỗi user bao nhiêu bài →
  `select u.name, count(p.id) as so_bai from user u left join post p on u.id = p.author_id group by u.id` →
  `[{ name: 'Than', so_bai: 3 }, { name: 'An', so_bai: 1 }, { name: 'Binh', so_bai: 1 }]`
- **10B:** dòng từ `execute()`: `instanceof User` = `false`; sửa `name` rồi `flush()` → **0 SQL**.
- **10C:** `.where({ name: 'Than' }).getResultList()` → `instanceof User` = `true`; `flush()` → `update user set name = 'Ten moi' where id = 1`.

## Ghi chú kỹ thuật

`createQueryBuilder` chỉ có trên `EntityManager` của bản SQL (`@mikro-orm/sqlite`, `@mikro-orm/postgresql`...),
không có trên bản `@mikro-orm/core`. Trong NestJS thường inject `EntityManager` từ `@mikro-orm/postgresql` là có sẵn.
Sandbox phải ép kiểu trong `orm.ts` vì `tsconfig` dùng `moduleResolution: "node"`.
