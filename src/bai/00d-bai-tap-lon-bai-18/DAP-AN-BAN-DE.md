# Đáp án — Ôn tập bài 18 (bản dễ)

> Làm xong từng bài trong `src/main.ts` rồi mới mở. Kết quả dưới đây đã chạy thật (Node 22, MikroORM 7.1.14).

## B1 — Thêm cột bắt buộc

| Câu | Đáp án |
|---|---|
| 1. SQL | `alter table san_pham add column gia integer not null;` |
| 2. Lỗi? | Có: *Cannot add a NOT NULL column with default value NULL*. 3 dòng cũ không biết điền `gia` là gì. |
| Sửa | `@Property({ default: 0 })` → 3 dòng có `gia = 0`. |

**Chốt:** ORM chỉ thấy cấu trúc, không thấy dữ liệu đang có trong bảng.

## B2 — ORM đoán đổi tên

| Câu | Đáp án |
|---|---|
| 1. `tenSp` → cột | `ten_sp` |
| 2. Đổi 1 cột | `rename column ten to ten_sp` → dữ liệu còn |
| 3. Đổi 2 cột | 2 `drop` + 2 `add` → cả 3 dòng thành `null`, **không báo lỗi** |
| 4. Vì sao | 1 cột mất + 1 cột mới cùng kiểu → chắc chắn là đổi tên. 2 cột `text` mất + 2 cột mới → không biết cột nào thành cột nào → drop/add. |

**Chốt:** đừng tin ORM đoán → không chạy `schema.update()` lên production.

## B3 — `create()`

| Câu | Đáp án |
|---|---|
| 1. Có rename? | Không. `up()` = 4 câu drop/add y hệt lần 2 của B2. |
| 2. DB đổi? | Bảng `san_pham` nguyên vẹn. Chỉ có thêm bảng sổ `mikro_orm_migrations` rỗng (`So : []`). |

**Chốt:** `create()` = viết kịch bản ra file. Chưa chạy gì lên dữ liệu.

## B4 — `up()` / `down()` (file chưa sửa)

| Lần xem | Cột | Dữ liệu | Sổ |
|---|---|---|---|
| Ban đầu | `id, ten, mo_ta` | còn | chưa có bảng sổ |
| Sau `up()` | `id, ten_sp, ghi_chu` | **null hết** | `[file]` |
| Sau `up()` lần 2 | như trên | null | `[file]` — chạy `[]` vì sổ đã ghi tên file |
| Sau `down()` | `id, ten, mo_ta` | **vẫn null** | `[]` — xoá tên khỏi sổ, file thành pending lại |

**Chốt:** `down()` không phải nút Undo — nó chỉ chạy đúng SQL viết trong `down()`.

## B5 — Sửa tay

```ts
override up(): void | Promise<void> {
  this.addSql(`alter table \`san_pham\` rename column \`ten\` to \`ten_sp\`;`);
  this.addSql(`alter table \`san_pham\` rename column \`mo_ta\` to \`ghi_chu\`;`);
}

override down(): void | Promise<void> {
  this.addSql(`alter table \`san_pham\` rename column \`ten_sp\` to \`ten\`;`);
  this.addSql(`alter table \`san_pham\` rename column \`ghi_chu\` to \`mo_ta\`;`);
}
```

Chạy lại `b4` → cả 4 lần xem đều còn But/Viết xanh, Vở/100 trang, Thước/30cm.

## B6 — Snapshot

| Buổi | `DUNG_SNAPSHOT = true` | `DUNG_SNAPSHOT = false` |
|---|---|---|
| SÁNG | `create table san_pham (id, ten)` | `create table san_pham (id, ten)` |
| CHIỀU | `add column gia` | `create table san_pham (id, ten, gia)` — lại tạo bảng! |
| TỐI | không sinh file | lại `create table` lần nữa (3 file) |
| `b6-deploy` | chạy êm cả 2 file, cột `id, ten, gia` | file 2 lỗi *table `san_pham` already exists* → rollback cả file 1, server không có bảng, sổ `[]` |

**Chốt:** có snapshot, `create()` so entity với **sổ snapshot** (những gì các file đã hứa), không so với DB local trống.

## B7 — Server tự `up()`

| Lần | File chờ chạy | `up()` chạy | Trả về |
|---|---|---|---|
| 1 (`b7 moi`) | 2 file | 2 file | `200`, 1 sản phẩm |
| 2 (`b7`) | `[]` | `[]` | `200`, 2 sản phẩm (dữ liệu lần 1 còn) |
| 3 (`CHAY_UP = false`, `b7 moi`) | 2 file | không gọi | `500` — log server: *no such table: san_pham* |

So với 18G: 18G lỗi *no column named email* vì DB đã có bảng nhưng thiếu cột mới. Ở đây DB mới tinh nên thiếu hẳn cả bảng.

**Chốt:** `up()` phải nằm **trước** `app.listen()`.

## B8 — Review

| Lỗi | Ở đâu | Hậu quả | Sửa |
|---|---|---|---|
| 1 | `add column gia integer not null` | `up()` nổ ngay, cả file rollback | thêm `default 0` |
| 2 | `drop mo_ta` + `add ghi_chu` | mất hết mô tả | `rename column mo_ta to ghi_chu` |
| 3 | `down()` thiếu rename `ten_sp → ten`, và add lại `mo_ta` rỗng | quay lui không về đúng bảng cũ | `down()` = đảo ngược `up()`: drop `gia`, rename 2 cột ngược lại |

Log khi chạy file gốc: chỉ thấy lỗi 1 (`up()` dừng ở câu đầu). Sửa xong lỗi 1 mới thấy lỗi 2 (mô tả thành `null`).

File đúng: [`nv6-dap-an.ts.bak`](nv6-dap-an.ts.bak). Chạy ra: sau `up()` cột `id, ten_sp, ghi_chu, gia` (gia = 0), sau `down()` về `id, ten, mo_ta`, dữ liệu còn đủ.
