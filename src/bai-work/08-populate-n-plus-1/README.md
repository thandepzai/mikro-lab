# Bài 8 (work-form): N+1 và `populate`

## Kết quả đo (7 post, 6 author, 15 comment)

| Endpoint | Số query | Cách làm |
|---|---|---|
| `GET /lab/bai08/n-plus-1` | **15** (1 + 7 user + 7 comment) | vòng `for`, mỗi post gọi `wrap(post.author).init()` và `post.comments.init()` |
| `GET /lab/bai08/populated` | **3** | `find` rồi `postRepository.populate(posts, { withAuthor, withComments })` |

Số query của N+1 tăng theo số post. Số query của `populate` luôn là 1 + số quan hệ.

## Luồng

1. Client gọi `GET /lab/bai08/populated`.
2. `Bai08Controller.populated` gọi `Bai08Service.findPopulated`.
3. `PostRepository.find({})` chạy `select ... from lab.post`.
4. `PostRepository.populate(posts, findOption)` đọc cờ `withAuthor`, `withComments`.
5. Mỗi cờ gọi `em.populate(posts, [quan hệ])`, ra đúng một câu `where id in (...)`.
6. Service gom thành `PostSummary[]`, controller trả JSON.

## Điều cần nhớ

1. MikroORM v6 không lazy load. `post.author` chỉ là reference có `id`, đọc `author.name` ra `undefined` nếu chưa `populate` hoặc `init`.
2. `wrap(entity).init()` luôn chạy query, kể cả khi entity đã nằm trong Identity Map. Log cho thấy `user id = 1` bị query hai lần vì post 1 và post 2 cùng author.
3. `em.populate` gom id lại, nên 7 post cho 1 query user, không phải 7.
4. Mặc định `em.populate` dùng chiến lược select-in (nhiều câu đơn giản), khác `joined` (một câu JOIN). Bài 9 so sánh hai cách.

## Ở BE file nào làm đúng việc này

| Việc | File ở BE (`/Users/mapclient.001/Work/backend/src/`) |
|---|---|
| Hàm `populate(entity, findOption)` với cờ `withX` | `module/order/domain/repository/activationCode.ts:26`, `campaign.ts:104` |
| `find` rồi `populate` cho danh sách | `activationCode.ts:131` (`findPaging_Populate`) |
| Giới hạn cột khi populate | `activationCode.ts:33` (`fields: [...]` trong `em.populate`) |

## Code ở lab

| File | Vai trò |
|---|---|
| `module/lab/domain/repository/post.ts` | `populate` theo mẫu BE |
| `module/lab/domain/config/type/post.ts` | `FindPostOption` |
| `module/lab/domain/service/bai08.ts` | `seed`, `findNPlusOne`, `findPopulated` |
| `module/lab/app/controller/bai08.ts` | 3 endpoint |

## Chạy lại

```bash
docker compose up -d
PORT=3101 npm run start:local
curl -XPOST localhost:3101/lab/bai08/seed
curl localhost:3101/lab/bai08/n-plus-1
curl localhost:3101/lab/bai08/populated
```

Xem log `[query]` ở terminal chạy server, đếm số dòng của từng lần gọi.
