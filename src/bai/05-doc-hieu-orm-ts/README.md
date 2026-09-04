# Bài 5 — Đọc hiểu `orm.ts`

> Học xong 04/09/2026 · [← về lộ trình](../../../README.md#lộ-trình)

**Code:**

- [`bai-05.ts.bak`](bai-05.ts.bak) — giữ nguyên code bài 1, bài tập nằm ở `orm.ts`
- [`orm.ts.bak`](orm.ts.bak) — ảnh chụp `src/orm.ts` tại thời điểm học bài này

---

Cả file chỉ có 15 dòng thật:

```ts
 9  export async function run(baiTap: BaiTap) {
10    const orm = await MikroORM.init({
11      entities: [User],
12      dbName: ':memory:',
13      metadataProvider: ReflectMetadataProvider,
14      debug: true,
15    });
16    await orm.schema.create();
17    const em = orm.em.fork();
18    em.create(User, { name: 'Than', email: 'than@example.com' });
19    await em.flush();
20    em.clear();
21    console.log('\n---------- BAT DAU ----------\n');
22    await baiTap(em, orm);
23    await orm.close(true);
24  }
```

Bốn dòng đã học từ trước mà không nhận ra:

| Dòng | Bài |
|---|---|
| 17 `orm.em.fork()` | [Bài 3](../03-fork-va-request-context/) — không được dùng `orm.em` trần |
| 18–19 `em.create` + `flush` | [Bài 4](../04-trang-thai-entity/) — `create` xếp hàng, `flush` mới `insert` |
| 20 `em.clear()` | [Bài 2](../02-unit-of-work/) — cắt quản lý |
| 14 `debug: true` | Nguồn gốc toàn bộ log SQL đọc suốt 4 bài |

## Bài tập — xoá 1 dòng, chạy, khôi phục

### A. Xoá `em.clear();` (dòng 20)

```
a === b ? true        <- không đổi
                      <- nhưng 0 CÂU SQL
```

**Ngược đời: xoá một dòng đi mà số SQL giảm từ 1 xuống 0.**

Dòng 18–19 seed đã tạo object `User#1` và `flush` xuống DB → nó đang nằm sẵn trong
`identityMap`. Bỏ `clear()` thì `findOne(User, 1)` **ăn thẳng identity map**, không hỏi DB.

→ `em.clear()` tồn tại để **vứt rác của phần seed đi**, cho mỗi bài bắt đầu bằng một `em` sạch —
giả vờ như một request mới vừa vào. Không có nó thì bài 1 vô nghĩa: sẽ không bao giờ thấy được
câu `select` đầu tiên.

### B. Xoá `await orm.schema.create();` (dòng 16)

```
TableNotFoundException: no such table: user
```

DB `:memory:` sinh ra **rỗng tinh**. `orm.schema.create()` chính là thứ sinh câu
`create table user (...)` ở đầu mọi log. **MikroORM không tự tạo bảng.**
Có entity không có nghĩa là có bảng.

> `schema.create()` chỉ hợp cho sandbox/test — nó không biết gì về dữ liệu đang có và không có
> đường lùi. Production dùng **migration**. Chi tiết ở bài 18.

### C. Xoá `metadataProvider: ReflectMetadataProvider,` (dòng 13)

```
Error: Please provide either 'type' or 'entity' attribute in User.id.
```

```ts
@PrimaryKey()
id!: number;        // <- kiểu `number` chỉ tồn tại trong TypeScript
```

TypeScript biên dịch xong là mất sạch type. MikroORM chạy lúc **runtime** nên không thấy `number`.
Ba mảnh phải đủ cả:

| Mảnh | Ở đâu | Việc |
|---|---|---|
| `emitDecoratorMetadata: true` | `tsconfig.json` | Sinh kèm type vào metadata lúc compile |
| `import 'reflect-metadata'` | `orm.ts` dòng 1 | Nạp API để đọc metadata đó |
| `metadataProvider: ReflectMetadataProvider` | config | Bảo MikroORM đi đọc chỗ đó |

Thiếu một trong ba → nổ. **v6 thì `ReflectMetadataProvider` là mặc định, v7 thì không** —
đây là ghi chú v6→v7 ở README gốc, giờ thấy nó nổ thật.
