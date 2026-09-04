import { run } from './orm';
import { User } from './entities/User';

// ===== BAI 5 - doc hieu orm.ts =====
// File nay giu nguyen code bai 1. Lan nay khong sua main.ts.
// Bai tap nam o src/orm.ts: xoa tung dong, chay lai, xem no no the nao.

run(async (em) => {

  const a = await em.findOne(User, 1);
  const b = await em.findOne(User, 1);

  console.log('a === b ?', a === b);

});
