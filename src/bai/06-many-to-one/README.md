# Bài 6 — ManyToOne / OneToMany

**Một câu:** DB chỉ lưu **số** (`author_id`), còn RAM lưu **object**. Chiều nào có cột thì có vỏ,
chiều nào không có cột thì có hộp khoá.

| | Trong DB | Trong RAM ngay sau khi load |
|---|---|---|
| `post.author` (ManyToOne) | cột `author_id = 1` | **vỏ** `{ id: 1 }`: có id, `name` là `undefined` |
| `user.posts` (OneToMany) | không có cột nào | **hộp khoá**: đụng vào là ném lỗi `not initialized` |

## 6A — DB lưu số, RAM lưu object
`findOne(Post, 1)` chỉ `select` bảng `post`. `post.author.id = 1`, `post.author.name = undefined`.

## 6B — Cái vỏ nằm trong Identity Map
Cái vỏ được **ghi vào sổ** (Identity Map) ngay lúc load post.
- `findOne(User, 1)` **vẫn `select`**, vì vỏ trong sổ chưa có dữ liệu.
- Dữ liệu được **đổ vào chính cái vỏ cũ**, nên `post.author === u` ra `true` và `post.author.name` thành `'Than'`.
- Gọi `findOne(User, 1)` lần 2 thì không còn câu SQL nào, vì vỏ đã đầy.

```js
const vo = { id: 1 }; map.set(1, vo); post.author = vo;   // lúc load post
Object.assign(vo, { name: 'Than' }); return vo;           // lúc findOne(User, 1)
```

## 6C — Hộp khoá
`u.posts.length` → `Error: Collection<Post> of entity User[1] not initialized`.
**Vì sao ném lỗi mà không trả `0`:** trả `0` là nói dối âm thầm (giống bug `em.clear()` bài 2).
Ném lỗi thì bug lộ ra ngay lúc code.

## 6D — Mở hộp bằng `load()`
`await u.posts.load()` → `select ... from post where author_id in (1)`.
Dùng `in (...)` chứ không phải `=` vì một câu có thể gom nhiều user: `in (1, 2, 3)` (bài 8–9).

## Bẫy: import vòng tròn
`User` import `Post` và `Post` import `User`, nên `@ManyToOne()` trống sẽ lỗi
`Please provide either 'type' or 'entity'`. Sửa bằng `@ManyToOne(() => User)`, tức là "khi nào cần hẵng tìm".

## Khuôn cố định: "A có nhiều B"

```ts
// Bên B (nhiều) — GỐC, viết trước, tạo cột a_id
@ManyToOne(() => A)
a!: A;

// Bên A (một) — LỐI TẮT, không tạo cột nào
@OneToMany(() => B, b => b.a)
bs = new Collection<B>(this);
```

- `() => B`: nhiều **cái gì**?
- `b => b.a`: bên kia trỏ về tôi bằng field **nào**? Phải chỉ rõ, vì B có thể có 2 field cùng trỏ về A (`author`, `editor`).
- `new Collection<B>(this)`: chép nguyên, chỉ đổi tên kiểu.

**Kiểm chứng:**
- Comment `@OneToMany` → `create table` **giống hệt từng chữ**.
- Comment `@ManyToOne` → mất cột `author_id` và mất foreign key.

**Tự làm:** `Comment` thuộc về `Post` (`src/entities/Comment.ts`) → bảng `comment` có `post_id`,
bảng `post` không thêm cột nào. Tên cột = tên field + `_id`, viết snake_case.
Entity chưa khai báo trong `entities: [...]` vẫn được tìm ra nhờ lần theo `() => Comment`.
