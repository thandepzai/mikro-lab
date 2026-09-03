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

## Quy ước trong repo

| Đường dẫn | Vai trò |
|---|---|
| `src/main.ts` | **Bài đang học.** Chỉ sửa file này. |
| `src/bai-NN.ts.bak` | Bài đã học xong, lưu lại kèm ghi chú đáp án. Không compile. |
| `src/orm.ts` | Phần dọn dẹp: mở DB, tạo bảng, seed. Mở ra đọc từ Chương 1 bài 4 trở đi. |
| `src/entities/` | Entity dùng cho các bài. |

Học xong một bài: `cp src/main.ts src/bai-NN.ts.bak` rồi viết bài mới vào `main.ts`.

## Cách đọc log SQL

Đây là kỹ năng chính của cả khoá, không phải phần phụ.

- `begin` … `commit` = một **transaction**. Được ăn cả, ngã về không.
- **Thấy `begin` là biết `flush()` vừa ghi xuống DB.** Không thấy `begin` = không ghi gì hết.
- `select` nằm **ngoài** transaction, vì chỉ đọc thì không cần.
- Bật/tắt ở `src/orm.ts` → `debug: true`.

---

## Lộ trình

### Chương 1 — Lõi ORM (chưa đụng NestJS)

- [x] **1. Identity Map** — vì sao `findOne` 2 lần chỉ ra 1 câu SQL
- [x] **2. Unit of Work** — vì sao sửa property là đủ, không cần `persist`
- [ ] **3. `em.fork()` và `RequestContext`** — vì sao NestJS bắt buộc phải có, thiếu thì nổ thế nào
- [ ] **4. 4 trạng thái của entity** — new / managed / detached / removed; `persist`, `remove`, `merge`
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
- **Tiếp theo:** bài 3 — `em.fork()` và `RequestContext`.
- **Còn treo:** project ở công ty đang chạy MikroORM version mấy? (`npm ls @mikro-orm/core`)
  Nếu là v6 thì phần `import` và cấu hình sẽ khác sandbox này.
