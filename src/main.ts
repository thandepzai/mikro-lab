import { run } from './orm';
import { User } from './entities/User';

// ===== BAI 2 - ket luan =====
// Chung minh: em.clear() KHONG reset gia tri cua object.
// No chi cat dut quan he "MikroORM dang quan ly object nay" (managed -> detached).

run(async (em) => {

  const u = await em.findOne(User, 1);

  u!.name = 'Ten moi';

  em.clear();

  await em.flush();          // -> khong co begin. Khong ghi gi ca.

  console.log('>> Object trong RAM  :', u!.name);     // 'Ten moi'  <- VAN DOI!

  const check = await em.findOne(User, 1);
  console.log('>> Gia tri trong DB  :', check!.name); // 'Than'     <- KHONG doi

  console.log('>> u === check ?     ', u === check);  // false

});
