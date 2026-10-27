# Bài 10 (work-form): QueryBuilder

## Ý chính

`find` + `populate` trả về entity. QueryBuilder dùng khi cần câu SQL mà `find` không diễn đạt được (`count`, `group by`, `update ... set x = x + 1`). Hàm cuối quyết định kiểu dữ liệu nhận về.

| Kết thúc bằng | Nhận về | Nằm trong Identity Map | `flush()` sau khi sửa |
|---|---|---|---|
| `.execute()` | object JS trơn, đúng các cột đã `select` | không | bị bỏ qua |
| `.getResultList()` | entity thật | có | sinh `update` |

Cần con số hoặc báo cáo thì dùng `execute()`. Cần entity để sửa thì dùng `find`.

## Luồng

1. Client gọi `GET /lab/bai10/posts-per-user`.
2. `Bai10Controller.postsPerUser` gọi `Bai10Service.countPostsPerUser`.
3. `UserRepository.countPostsPerUser` dùng `this.qb("u")` (có sẵn trong `BaseRepository`).
4. `select ... left join post ... group by u.id` chạy một câu duy nhất.
5. `execute()` trả mảng `{ id, name, post_count }`, controller trả JSON.

## Ở BE file nào làm đúng việc này

| Việc | File ở BE (`/Users/mapclient.001/Work/backend/src/`) |
|---|---|
| `this.qb().update(...).where(...).returning([...]).execute()` | `module/course/domain/repository/category.ts:56`, `channelDocument.ts:78` |
| `raw(...)` trong update, ví dụ `view_count + ?` | `module/course/domain/repository/channelDocument.ts:88` |
| `this.em.qb(Entity, "alias")` với `leftJoinAndSelect` | `module/order/domain/repository/activationCode.ts:42` |

## Code ở lab

| File | Vai trò |
|---|---|
| `module/lab/domain/repository/user.ts` | `countPostsPerUser` bằng `this.qb("u")` |
| `module/lab/domain/config/type/user.ts` | `UserPostCount` |
| `module/lab/domain/service/bai10.ts` | gọi repository |
| `module/lab/app/controller/bai10.ts` | endpoint `posts-per-user` |

## Chạy lại

```bash
docker compose up -d
PORT=3101 npm run start:local
curl localhost:3101/lab/bai10/posts-per-user
```
