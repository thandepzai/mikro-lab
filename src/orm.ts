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
