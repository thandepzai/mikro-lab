import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/sqlite';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import type { MikroORM as CoreORM } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/sqlite';   // ban SQL: co them createQueryBuilder (bai 10)
import { User } from './entities/User';
import { Post } from './entities/Post';
import { Comment } from './entities/Comment';

type BaiTap = (em: EntityManager, orm: CoreORM) => Promise<void>;

export async function run(baiTap: BaiTap) {
  const orm = await MikroORM.init({
    entities: [User, Post, Comment],
    dbName: ':memory:',
    metadataProvider: ReflectMetadataProvider,
    debug: true,
  });
  await orm.schema.create();
  const em = orm.em.fork();
  const than = em.create(User, { name: 'Than', email: 'than@example.com' });
  const an = em.create(User, { name: 'An', email: 'an@example.com' });
  const binh = em.create(User, { name: 'Binh', email: 'binh@example.com' });
  em.create(Post, { title: 'Bai dau tien', author: than });
  em.create(Post, { title: 'Bai cua An', author: an });
  em.create(Post, { title: 'Bai cua Binh', author: binh });
  await em.flush();
  em.clear();
  console.log('\n---------- BAT DAU ----------\n');
  // tsconfig dang dung moduleResolution "node" nen TS suy sai kieu em -> ep kieu tay
  await baiTap(em as unknown as EntityManager, orm);
  await orm.close(true);
}

export function trangThai(em: { getUnitOfWork(): unknown }, e: any): string {
  const uow: any = em.getUnitOfWork();
  const coId = e.id !== undefined && e.id !== null;
  const trongMap = coId && !!uow.getById(e.constructor.name, e.id);
  if (uow.getRemoveStack().has(e)) return 'REMOVED';
  if (trongMap) return 'MANAGED';
  if (uow.getPersistStack().has(e)) return 'NEW (da xep hang, cho flush)';
  if (coId) return 'DETACHED';
  return 'NEW';
}
