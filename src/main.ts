import { run, trangThai } from './orm';
import { User } from './entities/User';

// ===== BAI 4C - detached van con id =====
// Y het 4B, chi noi them 3 dong o cuoi.

run(async (em) => {

  const u = (await em.findOne(User, 1))!;
  em.remove(u);
  await em.flush();
  console.log('   trang thai:', trangThai(em, u), '| u.id =', u.id, '| u.name =', u.name);

  console.log('\n--- SAP GOI em.persist() lan nua ---');
  em.persist(u);
  await em.flush();
  console.log('--- XONG ---');
  console.log('   trang thai:', trangThai(em, u), '| u.id =', u.id);

  // --- Bai tap A: doi dong em.persist(u) thanh 2 dong nay:
  //         em.merge(u);
  //         u.name = 'Doi sau merge';
  //     Doc ky cau SQL sinh ra, KE CA phan trong ngoac vuong o cuoi dong.

});
