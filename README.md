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
Trong DB luôn có sẵn:
- `user`: `id = 1, name = 'Than', email = 'than@example.com'`
- `post`: `id = 1, title = 'Bai dau tien', author_id = 1` *(thêm từ bài 6)*
- Từ bài 8 thêm: user `2 An`, `3 Binh`; post `2 'Bai cua An'` (author 2), `3 'Bai cua Binh'` (author 3)

> **Bắt buộc Node 22+** (`nvm use`, đã có `.nvmrc`). MikroORM v7 yêu cầu Node >= 22.17.
> Bài 1–17 chạy tạm được trên Node 20 nhờ `overrides` hạ `better-sqlite3`, nhưng từ bài 18
> `@mikro-orm/migrations` dùng `fs.globSync` (chỉ có từ Node 22) → đã nâng lên Node 22 và bỏ `overrides`.

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

- [x] **6. ManyToOne / OneToMany** — cách MikroORM lưu quan hệ trong RAM → [ghi chú](src/bai/06-many-to-one/)
- [x] **7. `Ref` / `Reference`** — entity chưa load nhưng vẫn dùng được → [ghi chú](src/bai/07-ref/)
- [x] **8. `populate` và N+1** — tự tay tạo ra bug N+1 rồi tự sửa → [ghi chú](src/bai/08-populate-n-plus-1/)
- [x] **9. Loading strategy** — `select-in` vs `joined`, khi nào chọn cái nào → [ghi chú](src/bai/09-loading-strategy/)
- [x] **10. QueryBuilder** — khi nào `em.find` không đủ, và cái giá phải trả → [ghi chú](src/bai/10-query-builder/)

### Chương 3 — Ghi dữ liệu cho đúng

- [x] **11. Transaction** — `em.transactional()`, `@Transactional()`, lồng nhau → [ghi chú](src/bai/11-transaction/)
- [x] **12. Thứ tự flush** — MikroORM tự sắp xếp insert/update/delete thế nào → [ghi chú](src/bai/12-thu-tu-flush/)
- [x] **13. Filters** — soft delete và multi-tenant không cần lặp `where` khắp nơi → [ghi chú](src/bai/13-filters/)
- [x] **14. Hooks & EventSubscriber** — `@BeforeCreate`, audit field tự động → [ghi chú](src/bai/14-hooks/) *(EventSubscriber để dành)*
- [x] **15. Serialization** — `wrap()`, `toJSON()`, ẩn field nhạy cảm khỏi response → [ghi chú](src/bai/15-serialization/)

### Chương 4 — NestJS thật

- [x] **16. `MikroOrmModule`** — `forRoot`, inject `EntityManager` → [ghi chú](src/bai/16-mikro-orm-module/) *(`forFeature` / `EntityRepository` để dành)*
- [x] **17. `RequestContext` middleware** — và `@CreateRequestContext()` cho cron / queue / worker → [ghi chú](src/bai/17-request-context-middleware/)
- [ ] **18. Migration** — `SchemaGenerator` vs migration thật, quy trình an toàn khi deploy → [ghi chú](src/bai/18-migration/) *(xong 18A–G + review, đang làm bài tập lớn bài 18)*
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
| 6 | [ManyToOne / OneToMany](src/bai/06-many-to-one/) | DB lưu số, RAM lưu object. `post.author` = **vỏ** chỉ có id, nằm trong Identity Map, load xong thì đổ vào chính vỏ đó. `user.posts` = **hộp khoá**, đụng vào là ném lỗi, không trả `0` cho êm. |
| 7 | [`Ref` / `Reference`](src/bai/07-ref/) | `ref: true` → TS chặn `post.author.name` ngay lúc biên dịch. Lấy dữ liệu bằng `load()`; chắc đã load thì `getEntity()` (ném lỗi nếu chưa), tránh `unwrap()` (âm thầm `undefined`). |
| 8 | [`populate` và N+1](src/bai/08-populate-n-plus-1/) | `load()` trong `for` = 1 + N câu (1000 post → 1001). `populate: ['author']` → 1 câu `join`. Có populate thì TS mới cho `.$`. Dấu hiệu: `await` quan hệ bên trong vòng lặp. |
| 9 | [Loading strategy](src/bai/09-loading-strategy/) | `joined` = 1 câu nhưng bên "một" bị lặp mỗi dòng (Than 5 post → 5 dòng mang tên Than). `select-in` = 2 câu `where id in (...)`, không lặp. Chiều một → `joined`; chiều nhiều → `select-in`. |
| 10 | [QueryBuilder](src/bai/10-query-builder/) | Dùng cho `count` / `group by`. Hàm cuối quyết định: `execute()` = object trơn, **ngoài sổ**, sửa rồi flush bị bỏ qua âm thầm; `getResultList()` = entity thật, flush ra `update`. `raw()` = nguyên văn, cấm nhét input người dùng. |
| 11 | [Transaction](src/bai/11-transaction/) | `flush()` tự mở/đóng transaction riêng — nhiều `flush` rời nhau là nhiều giao dịch. `em.transactional()` gộp các `flush` bên trong thành **một** `begin...commit`; lỗi giữa chừng → `rollback` xoá sạch, kể cả phần đã "chạy" trước lỗi. Lồng `transactional()` không mở `begin` mới (DB không cho) — sinh `savepoint`; lỗi bên trong chỉ rollback tới savepoint đó, phần ngoài (trước/sau) không bị ảnh hưởng. |
| 12 | [Thứ tự flush](src/bai/12-thu-tu-flush/) | SQL trong một `flush()` không chạy theo thứ tự viết code. Nhóm insert: entity bị tham chiếu (FK) insert trước entity tham chiếu tới nó, tự tính theo đồ thị phụ thuộc. Toàn cục: luôn **insert → update → delete**, dù code gọi xen kẽ thế nào. |
| 13 | [Filters](src/bai/13-filters/) | `em.addFilter({ name, cond, entity })` — 1 object, tự chèn `WHERE` vào mọi `find`/`findOne` cho entity đó, mặc định luôn bật (`filters: false` để tắt tạm). `cond` dạng hàm + `args: true` → truyền tham số riêng mỗi lần gọi, dùng cho multi-tenant thật (tenantId lấy từ request, không hardcode). |
| 14 | [Hooks](src/bai/14-hooks/) | `@BeforeCreate`/`@BeforeUpdate` chạy sau `begin`, trước khi dựng SQL → giá trị gán đi luôn vào `insert`/`update`. `createdAt` chỉ gán lúc tạo. **Bẫy:** `?` của TS không làm cột được NULL — phải `@Property({ nullable: true })`. |
| 15 | [Serialization](src/bai/15-serialization/) | Quan hệ chưa load bị bỏ khỏi JSON. `hidden: true` chỉ giấu khỏi JSON — vẫn `select`, vẫn đọc được `u.email`. Populate `posts` thì `author` trong post chỉ in id (tránh vòng lặp). |
| 16 | [`MikroOrmModule`](src/bai/16-mikro-orm-module/) | `forRoot` chỉ ghi config, `NestFactory` gọi `init()` rồi cất vào DI container. `em` inject = `orm.em` toàn cục → ngoài request bị chặn. Trong `RequestContext.create` cùng biến `em` chạy được, `em.id` đổi: `em` toàn cục là vỏ chuyển tiếp sang bản fork. |
| 17 | [`RequestContext` middleware](src/bai/17-request-context-middleware/) | `forRoot` tự gắn middleware cho mọi route: `RequestContext.create(orm.em, next)` → mỗi HTTP request một bản fork. Cron/queue/worker không qua route → lỗi như 16B. Sửa bằng `@CreateRequestContext()` (class cần property `em` hoặc `orm`). |

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
- **Tiếp theo:** xong lý thuyết bài 18 (18G server tự `up()` + review migration ngày 21/10/2026). `src/main.ts` đang là **bài tập lớn bài 18** (6 nhiệm vụ, đáp án ở `src/bai/00d-bai-tap-lon-bai-18/`): NV1 Claude đã làm mẫu, **người học làm tiếp từ NV2**. Chạy bằng `npm run dev -- <lenh>` (phải compile vì `up()` đọc `dist/`). **Rút kinh nghiệm bài tập lớn:** đưa đề 6 nhiệm vụ → người học chưa hiểu cách làm; làm mẫu trọn NV1 (ghi dự đoán → điền TODO → chạy → sửa → trả lời câu hỏi) thì hiểu. **Rút kinh nghiệm 18F:** giải thích bằng pseudo-code JS lần đầu → người học không hiểu. Kể lại bằng **câu chuyện có lỗi cụ thể** (sáng `create`, chưa `up`, chiều `create` lần nữa → 2 file `create table` trùng → deploy nổ) + bảng 3 dòng khớp với log → hiểu ngay. Ưu tiên kể chuyện "không có cái này thì hỏng thế nào" trước khi nói cơ chế. Xem mục "Học tiếp từ đây" trong [ghi chú bài 18](src/bai/18-migration/). **Rút kinh nghiệm 18D:** lần đầu giải thích bằng bảng so sánh + sơ đồ + hỏi sang 18E ngay → người học chưa hiểu gì, bực. Cách hiệu quả: viết lại hàm bằng JS thuần (`create() = getUpdateSchemaSQL() + fs.writeFileSync`), rồi đi **từng đoạn code trong `main.ts`**. Không chuyển bài khi người học chưa xác nhận hiểu. Người học từng hiểu nhầm "migration chỉ là log" và "`down()` tự khôi phục" — cần nhấn: file là kịch bản sẽ chạy, `down()` chỉ chạy đúng SQL viết trong nó. Người học dễ rối khi sandbox "tạo rồi xoá" để giả lập DB cũ → bài 18 dùng entity riêng `KhachHang` + DB cũ dựng bằng SQL tay, kể theo câu chuyện "DB tháng 1 / code tháng 3". Còn để dành: `forFeature` / `EntityRepository` (bài 16). Bài 16 xong 16A–D, bài 17 xong 17A–C (có HTTP thật qua `@nestjs/platform-express`); người học yếu phần NestJS cơ bản (decorator, `NestFactory`, DI) → giải thích bằng JS thuần trước. Sandbox bài 16+ dùng `MikroOrmModule.forRoot` + `taoBangVaSeed(orm)` trong `main.ts`. Entity hiện tại: `Comment` có `createdAt`/`updatedAt`/`deletedAt` (đều nullable) + hook; `User.email` là `hidden: true`. Đã làm bài tập lớn Chương 3 (`src/bai/00c-bai-tap-lon-chuong-3/`), đạt cả 5 nhiệm vụ. EventSubscriber (bài 14) còn để dành.
- **Sandbox đổi từ bài 10:** `orm.ts` truyền `em` kiểu `EntityManager` của `@mikro-orm/sqlite` (ép kiểu) để có `createQueryBuilder`. Seed có 3 user, 3 post (xem phần Chạy).
- **Còn treo:** project ở công ty đang chạy MikroORM version mấy? (`npm ls @mikro-orm/core`)
  Nếu là v6 thì phần `import` và cấu hình sẽ khác sandbox này.
