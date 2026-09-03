import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/sqlite';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import type { EntityManager } from '@mikro-orm/core';
import { User } from './entities/User';

export async function run(baiTap: (em: EntityManager) => Promise<void>) {
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
  await baiTap(em);
  await orm.close(true);
}
