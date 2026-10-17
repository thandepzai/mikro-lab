// BAI 18D — migrator.create(): ORM viet SQL ra FILE thay vi chay luon
import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/sqlite';
import { Migrator } from '@mikro-orm/migrations';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

// CODE THANG 3: doi ten hoTen -> name, sdt -> phone
@Entity()
class KhachHang {
  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  name?: string;

  @Property({ nullable: true })
  phone?: string;
}

async function main() {
  const orm = await MikroORM.init({
    entities: [KhachHang],
    dbName: ':memory:',
    metadataProvider: ReflectMetadataProvider,
    extensions: [Migrator],
    migrations: { path: 'dist/migrations', pathTs: 'src/migrations', snapshot: false },
  });
  const conn = orm.em.getConnection();

  // DB THANG 1: cot ho_ten, sdt — da co 3 khach
  await conn.execute('create table `khach_hang` (`id` integer not null primary key autoincrement, `ho_ten` text null, `sdt` text null)');
  await conn.execute("insert into `khach_hang` (`ho_ten`, `sdt`) values ('Than', '0901'), ('An', '0902'), ('Binh', '0903')");

  console.log('\n---------- BAT DAU ----------\n');
  console.log('--- SAP GOI migrator.create() ---');
  const kq = await orm.migrator.create();
  console.log('File vua tao:', kq.fileName);
  console.log('--- XONG ---');

  console.log('DB sau khi create:', await conn.execute('select * from `khach_hang`'));

  await orm.close(true);
}
main();
