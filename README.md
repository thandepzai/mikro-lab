# mikro-lab

Sổ tay học MikroORM chuyên sâu (v7) — từ lõi ORM đến ghép vào NestJS.
Mỗi bài là một thí nghiệm nhỏ tự chạy được, học bằng cách **nhìn log SQL** chứ không học thuộc API.

> **File này là nguồn sự thật duy nhất về tiến độ.** Học xong bài nào thì tick vào lộ trình
> và ghi lại vào phần Nhật ký, rồi push. Lần sau chỉ cần đưa file này cho Claude là biết đang ở đâu.

---

## Chạy

```bash
npm install
npm run dev
```

SQLite in-memory — không cần Docker, không cần Postgres, không cần config gì.
Trong DB luôn có sẵn 1 dòng: `id = 1, name = 'Than', email = 'than@example.com'`.

> **Node 20 → segfault.** `@mikro-orm/sqlite` v7 ghim `better-sqlite3@13`, bản này yêu cầu Node >= 22.
> Chạy trên Node 20 thì process chết ngay (exit 139) mà không có message. Repo đã hạ xuống bằng
> `overrides` trong `package.json`. Nếu sau này nâng lên Node 22+ thì xoá `overrides` đi.

## Quy ước trong repo

| Đường dẫn | Vai trò |
|---|---|
| `src/main.ts` | **Bài đang học.** Chỉ sửa file này. |
| `src/orm.ts` | Phần dọn dẹp: mở DB, tạo bảng, seed, hàm `trangThai()`. Truyền `(em, orm)` vào bài tập. |
| `src/entities/` | Entity dùng cho các bài. |
| `src/bai/NN-ten-bai/` | Bài đã học xong: `README.md` ghi chú + các file `.ts.bak`. Không compile. |

Học xong một bài:

```bash
mkdir -p src/bai/NN-ten-bai
cp src/main.ts src/bai/NN-ten-bai/bai-NN.ts.bak     # kèm ghi chú kết quả ở cuối file
```

rồi viết ghi chú vào `src/bai/NN-ten-bai/README.md`, thêm một dòng vào bảng
[Nhật ký học](#nhật-ký-học), và viết bài mới vào `src/main.ts`.

## Cách đọc log SQL

Đây là kỹ năng chính của cả khoá, không phải phần phụ.

- `begin` … `commit` = một **transaction**. Được ăn cả, ngã về không.
- **Thấy `begin` là biết `flush()` vừa ghi xuống DB.** Không thấy `begin` = không ghi gì hết.
- `select` nằm **ngoài** transaction, vì chỉ đọc thì không cần.
- Bật/tắt ở `src/orm.ts` → `debug: true`.

---

## `em` thực chất là cái gì

Không có gì huyền bí. Chỉ là **object JS bình thường** giữ vài cái `Map` / `Set`:

```js
em = {
  identityMap:  new Map(),   // bài 1: đang giữ object nào
  persistStack: new Set(),   // bài 4: hàng chờ INSERT
  removeStack:  new Set(),   // bài 4: hàng chờ DELETE
}
```

### Ảnh chụp gốc KHÔNG nằm trong `em`

Bài 2 tôi vẽ `original: new Map()` nằm trong `em`. **Sai.** Ảnh chụp lúc load được gắn thẳng
lên **chính object entity**, ở một property ẩn:

```js
u = {
  id: 1, name: 'Than', email: 'than@example.com',

  __originalEntityData: { id: 1, name: 'Than', email: 'than@example.com' },   // <- ẩn
}
```

`em` không giữ bản sao — khi cần so, nó **đọc ngược ra từ object**. Kiểm chứng:

```ts
em.clear();
uow.getOriginalEntityData(u)        // -> {"id":1,"name":"Than",...}  vẫn còn nguyên
helper(u).__originalEntityData      // -> giống hệt
```

→ **`em.clear()` dọn `identityMap` nhưng không đụng được vào ảnh chụp.** Object detached vẫn
tự mang theo bằng chứng *"tao từ DB ra, tao không mới"*.

Đây là lý do `persist()` một object đã `clear()` **không bao giờ INSERT**, và **không cần hỏi
DB câu nào** — nó nhìn cái property ẩn đó là biết. Chi tiết ở [bài 4](src/bai/04-trang-thai-entity/#persist-trên-một-object-đã-detached).

### Ba hàm hay dùng nhất, viết lại bằng JS thuần

```js
em.persist(u)  →  persistStack.add(u)      // xong. Không đụng DB.
em.remove(u)   →  removeStack.add(u)       // xong. Không đụng DB.

em.flush()     →  begin
                  persistStack  → sinh INSERT
                  so identityMap với original → sinh UPDATE
                  removeStack   → sinh DELETE
                  commit
```

> **`persist` và `remove` chỉ là ghi vào sổ. `flush` mới là người đi làm.**

Đây là bài 2 nói tiếp: bài 2 không gọi `persist` mà vẫn `update` được, vì `flush` tự so
`identityMap` với `original`. `persist` sinh ra là để xử lý object **mới toanh** — chưa nằm
trong `identityMap` nên không có gì để so.

### Bảng tên trạng thái

`trangThai()` trong `src/orm.ts` là **hàm tự viết**, không phải API MikroORM.
Nó chỉ nhìn xem object đang nằm trong cái nào ở trên rồi đặt tên:

| Nằm ở đâu | Tên gọi |
|---|---|
| Không ở đâu cả | `NEW` |
| Trong `persistStack` | `NEW`, đang chờ flush |
| Trong `identityMap` | `MANAGED` |
| Trong `removeStack` | `REMOVED` |
| Có `id` nhưng không ở đâu cả | `DETACHED` |

---

## Lộ trình

### Chương 1 — Lõi ORM (chưa đụng NestJS)

- [x] **1. Identity Map** — vì sao `findOne` 2 lần chỉ ra 1 câu SQL → [ghi chú](src/bai/01-identity-map/)
- [x] **2. Unit of Work** — vì sao sửa property là đủ, không cần `persist` → [ghi chú](src/bai/02-unit-of-work/)
- [x] **3. `em.fork()` và `RequestContext`** — vì sao NestJS bắt buộc phải có, thiếu thì nổ thế nào → [ghi chú](src/bai/03-fork-va-request-context/)
- [x] **4. 4 trạng thái của entity** — new / managed / detached / removed; `persist`, `remove`, `merge` → [ghi chú](src/bai/04-trang-thai-entity/)
- [x] **5. Đọc hiểu `orm.ts`** — quay lại mổ file đã bỏ qua từ bài 1 → [ghi chú](src/bai/05-doc-hieu-orm-ts/)

### Chương 2 — Quan hệ và truy vấn

- [ ] **6. ManyToOne / OneToMany** — cách MikroORM lưu quan hệ trong RAM
- [ ] **7. `Ref` / `Reference`** — entity chưa load nhưng vẫn dùng được
- [ ] **8. `populate` và N+1** — tự tay tạo ra bug N+1 rồi tự sửa
- [ ] **9. Loading strategy** — `select-in` vs `joined`, khi nào chọn cái nào
- [ ] **10. QueryBuilder** — khi nào `em.find` không đủ, và cái giá phải trả

### Chương 3 — Ghi dữ liệu cho đúng

- [ ] **11. Transaction** — `em.transactional()`, `@Transactional()`, lồng nhau
- [ ] **12. Thứ tự flush** — MikroORM tự sắp xếp insert/update/delete thế nào
- [ ] **13. Filters** — soft delete và multi-tenant không cần lặp `where` khắp nơi
- [ ] **14. Hooks & EventSubscriber** — `@BeforeCreate`, audit field tự động
- [ ] **15. Serialization** — `wrap()`, `toJSON()`, ẩn field nhạy cảm khỏi response

### Chương 4 — NestJS thật

- [ ] **16. `MikroOrmModule`** — `forRoot` / `forFeature`, inject `EntityRepository`
- [ ] **17. `RequestContext` middleware** — và `@CreateRequestContext()` cho cron / queue / worker
- [ ] **18. Migration** — `SchemaGenerator` vs migration thật, quy trình an toàn khi deploy
- [ ] **19. Testing** — sqlite in-memory, rollback sau mỗi test
- [ ] **20. Performance** — partial loading, batch insert, result cache, khi nào tắt Identity Map

---

## Nhật ký học

Mỗi bài một thư mục trong `src/bai/`, gồm `README.md` (ghi chú + đáp án) và các file `.ts.bak` đã chạy.

| Bài | Ghi chú | Điểm rút ra |
|---|---|---|
| 1 | [Identity Map](src/bai/01-identity-map/) | Một `em`, một dòng DB → **duy nhất một object** trong RAM. Dữ liệu trong RAM luôn thắng dữ liệu vừa lấy từ DB. |
| 2 | [Unit of Work](src/bai/02-unit-of-work/) | `flush()` = so object với ảnh chụp lúc load. `em.clear()` không reset giá trị — nó cắt quan hệ quản lý. Bug **âm thầm**. |
| 3 | [`em.fork()` và `RequestContext`](src/bai/03-fork-va-request-context/) | Hai request chung một `em` = rò dữ liệu chéo. `RequestContext` = `fork()` tự động. `allowGlobalContext: true` là bẫy. |
| 4 | [4 trạng thái của entity](src/bai/04-trang-thai-entity/) | `persist`/`remove`/`merge` chỉ ghi vào sổ, `flush` mới đi làm. Ảnh chụp gốc nằm **trên object**, sống sót qua `clear()`. |
| 5 | [Đọc hiểu `orm.ts`](src/bai/05-doc-hieu-orm-ts/) | MikroORM **không tự tạo bảng**. `metadataProvider` cần đủ 3 mảnh (`emitDecoratorMetadata` + `reflect-metadata` + config). `em.clear()` sau seed là thứ khiến bài 1 nhìn thấy được câu `select`. |

---

## Ghi chú MikroORM v6 → v7

v7 tách decorator ra khỏi `@mikro-orm/core`:

```ts
// v6
import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

// v7
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
```

Và `ReflectMetadataProvider` **không còn là mặc định** — phải khai báo trong config
(xem `src/orm.ts`). Đây là kiểu decorator NestJS đang dùng (`experimentalDecorators`).
Bản `@mikro-orm/decorators/es` là decorator theo chuẩn ES mới, chưa dùng ở đây.

---

## Dành cho Claude ở phiên sau

Đọc file này là đủ để biết đang ở đâu. Chi tiết từng bài nằm trong `src/bai/NN-*/README.md`,
chỉ mở ra khi cần. Tóm tắt bối cảnh:

- **Người học:** fullstack dev, ~3 năm Next.js, ~1 năm NestJS. Đang dùng MikroORM + NestJS
  ở công ty nhưng chưa chuyên sâu. Không có khoá YouTube nào để theo.
- **Cách dạy đã hiệu quả:** **một khái niệm — một thí nghiệm mỗi lần.** Nhồi nhiều thứ
  cùng lúc là không tiếp thu được. Luôn bắc cầu từ JS/Node thuần (`Map`, `===`, object reference)
  trước khi nói thuật ngữ ORM. Giải thích bằng tiếng Việt, ngắn gọn, thẳng thắn.
- **Nhịp làm việc:** đưa code tối giản vào `src/main.ts` (2–4 dòng thật, phần dọn dẹp giấu
  trong `orm.ts`) → người học chạy `npm run dev` → **tự đọc log SQL** → trả lời câu hỏi →
  chấm bài rồi mới sang bài kế.
- **Không làm:** đừng đưa nhiều thí nghiệm trong một file, đừng giải thích lý thuyết dài
  trước khi họ chạy code.
- **Rút kinh nghiệm từ bài 4:** nhồi 5 khái niệm + 2 bài tập vào một file là tắc ngay. Tách
  thành 4A / 4B / 4C, mỗi file **một việc**, và chèn mốc `console.log('--- SAP GOI x() ---')`
  quanh lời gọi cần soi — để nhìn ra câu SQL rơi vào giữa hai mốc nào. Nhịp này chạy được.
- **Không khẳng định hành vi ORM khi chưa chạy thử.** Bài 4 đã viết sai một bảng vào README vì
  suy luận thay vì chạy. Chạy trước, viết sau.
- **Tiếp theo:** bài 6 — ManyToOne / OneToMany. Hết Chương 1, bắt đầu Chương 2.
  Cần thêm entity mới (vd `Post`) vào `src/entities/`.
- **Còn treo:** project ở công ty đang chạy MikroORM version mấy? (`npm ls @mikro-orm/core`)
  Nếu là v6 thì phần `import` và cấu hình sẽ khác sandbox này.
