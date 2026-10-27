# Bài 19 — Testing *(xong 19A–G)*

## Chỉ cần nhớ

- Chạy test bằng `node:test` có sẵn của Node, không cần cài jest: `npx tsc && node --test dist/main.js`. `assert.equal(thucTe, mongDoi)` ném lỗi nếu khác nhau → test đỏ. Dùng `node:assert/strict` để so bằng `===`.
- Nhiều test dùng chung 1 DB mà không dọn → **test phụ thuộc thứ tự**. Test "tạo Moi" chạy trước thì test "đếm 3" đỏ; đảo thứ tự thì cả hai xanh. Lỗi kiểu "máy mình xanh, CI đỏ".
- Cách 1 — dựng lại DB mỗi test (`beforeEach` / `afterEach`): luôn sạch, đơn giản, nhưng chậm.
- Cách 2 — dựng DB **một lần** (`before` / `after`), mỗi test bọc trong transaction: `beforeEach` → `em = orm.em.fork(); await em.begin()`, `afterEach` → `await em.rollback()`. `flush()` trên `em` đã `begin` **không `commit`**, chỉ ghi lên "tờ nháp"; `count` cùng transaction vẫn thấy dòng mới; rollback xé tờ nháp → sổ thật chưa từng bị ghi.
- Đo trên SQLite `:memory:`, 3 user, 200 vòng: dựng lại ≈ 430–540 ms, rollback ≈ 35–49 ms → rollback nhanh khoảng **11–12 lần**. DB thật / seed lớn thì khác (chưa đo).
- Quên `rollback` → `begin` của test sau **kẹt** (SQLite 1 connection), báo *"Promise resolution is still pending but the event loop has already resolved"*, test sau đỏ vì không chạy được chứ không phải vì sai giá trị.
- Service gọi `em.transactional(em)` bên trong transaction của test → tạo `savepoint`, `release savepoint`; rollback ngoài vẫn xoá sạch. An toàn.
- Service tự `orm.em.fork()` rồi `flush()` → có tờ nháp riêng, **commit vào sổ thật sau khi test đã rollback** → dữ liệu rác lọt sang test sau.
- Service NestJS inject `em` toàn cục: gọi thẳng ngoài request → lỗi *"Using global EntityManager instance..."* (bài 16/17).
- Bọc `RequestContext.create(emCuaTest, ...)` **không cứu được**: nó luôn `em.fork(...)` ra bản mới (kiểu TS còn chặn `keepTransactionContext`), kết quả giống service tự fork.
- Cách đúng: đưa đúng `em` của test vào service bằng `@nestjs/testing`:

```ts
const module = await Test.createTestingModule({
  providers: [UserService, { provide: EntityManager, useValue: em }],
}).compile();
const service = module.get(UserService);
```

- Phải `await service.taoMoi()` rồi mới `count`; thiếu `await` thì `count` chạy khi `insert` chưa xong → lúc xanh lúc đỏ.

## Kết quả đã chạy

- 19A: 1 DB chung, test "Moi" chạy trước → `ok 1`, `not ok 2` (`4 !== 3`). Đảo thứ tự → xanh cả hai.
- 19B: `beforeEach` dựng DB mới → xanh cả hai, bất kể thứ tự.
- 19C: `before` + `begin`/`rollback` mỗi test → xanh cả hai; log không có `commit` quanh `insert Moi`. Xoá `rollback` → test 2 kẹt.
- 19D: 200 vòng mỗi cách: dựng lại 430–543 ms, rollback 35–49 ms (11–12 lần).
- 19E: A (`em.transactional`) → 3; B (service tự fork) → `begin` kẹt 2 giây, sau rollback mới `insert` + `commit` → 4.
- 19F: C gọi thẳng → lỗi global EM; D `new UserService(em)` → 3; E `RequestContext.create(em)` → kẹt, rồi 4.
- 19G: `Test.createTestingModule` với `useValue: em` → xanh cả hai. Thử `useValue: orm.em.fork()` → cả hai đỏ vì kẹt.

## Chưa kiểm chứng

- Hành vi trên Postgres (nhiều connection): service tự fork nhiều khả năng không kẹt mà vẫn `commit` vào sổ thật.
- Đo tốc độ với DB thật và seed lớn.
- Chạy test song song trên cùng một DB.

## File

`bai-19a.ts.bak` … `bai-19g.ts.bak`. Gói thêm: `@nestjs/testing@11.2.5` (devDependency).
