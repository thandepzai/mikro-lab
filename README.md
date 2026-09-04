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
| `src/bai-NN.ts.bak` | Bài đã học xong, lưu lại kèm ghi chú đáp án. Không compile. |
| `src/orm.ts` | Phần dọn dẹp: mở DB, tạo bảng, seed. Truyền `(em, orm)` vào bài tập. Mở ra đọc từ Chương 1 bài 4 trở đi. |
| `src/entities/` | Entity dùng cho các bài. |

Học xong một bài: `cp src/main.ts src/bai-NN.ts.bak` rồi viết bài mới vào `main.ts`.

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
DB câu nào** — nó nhìn cái property ẩn đó là biết. Chi tiết ở [bài 4](#persist-trên-một-object-đã-detached).

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

- [x] **1. Identity Map** — vì sao `findOne` 2 lần chỉ ra 1 câu SQL
- [x] **2. Unit of Work** — vì sao sửa property là đủ, không cần `persist`
- [x] **3. `em.fork()` và `RequestContext`** — vì sao NestJS bắt buộc phải có, thiếu thì nổ thế nào
- [x] **4. 4 trạng thái của entity** — new / managed / detached / removed; `persist`, `remove`, `merge`
- [ ] **5. Đọc hiểu `orm.ts`** — quay lại mổ file đã bỏ qua từ bài 1

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

### Bài 1 — Identity Map ✅ (02/09/2026) → `src/bai-01.ts.bak`

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

### Bài 2 — Unit of Work ✅ (02/09/2026) → `src/bai-02.ts.bak`

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
> [`em` thực chất là cái gì](#em-thực-chất-là-cái-gì). Phần còn lại của bài 2 vẫn đúng.

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

### Bài 3 — `em.fork()` và `RequestContext` ✅ (03/09/2026) → `src/bai-03a.ts.bak`, `src/bai-03b.ts.bak`

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

### Bài 4 — 4 trạng thái của entity ✅ (04/09/2026) → `src/bai-04a/b/c.ts.bak`

Xem mục [`em` thực chất là cái gì](#em-thực-chất-là-cái-gì) ở trên cho mô hình `Map`/`Set`.

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

### `persist()` trên một object đã `DETACHED`

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

### `merge()`

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

Đọc file này là đủ để dạy tiếp, không cần hỏi lại từ đầu. Tóm tắt bối cảnh:

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
- **Tiếp theo:** bài 5 — đọc hiểu `src/orm.ts`, file đã bỏ qua từ bài 1.
- **Còn treo:** project ở công ty đang chạy MikroORM version mấy? (`npm ls @mikro-orm/core`)
  Nếu là v6 thì phần `import` và cấu hình sẽ khác sandbox này.
