import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/sqlite';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import type { EntityManager, MikroORM as CoreORM } from '@mikro-orm/core';
import { User } from './entities/User';

type BaiTap = (em: EntityManager, orm: CoreORM) => Promise<void>;

export async function run(baiTap: BaiTap) {
  const orm = await MikroORM.init({
    entities: [User],
    dbName: ':memory:',
    metadataProvider: ReflectMetadataProvider,
    debug: true,
  });
  await orm.schema.create();
  const em = orm.em.fork();
  em.create(User, { name: 'Than', email: 'than@example.com' });
  await em.flush();
  em.clear();
  console.log('\n---------- BAT DAU ----------\n');
  await baiTap(em, orm);
  await orm.close(true);
}

export function trangThai(em: EntityManager, e: any): string {
  const uow: any = em.getUnitOfWork();
  const coId = e.id !== undefined && e.id !== null;
  const trongMap = coId && !!uow.getById(e.constructor.name, e.id);
  if (uow.getRemoveStack().has(e)) return 'REMOVED';
  if (trongMap) return 'MANAGED';
  if (uow.getPersistStack().has(e)) return 'NEW (da xep hang, cho flush)';
  if (coId) return 'DETACHED';
  return 'NEW';
}
