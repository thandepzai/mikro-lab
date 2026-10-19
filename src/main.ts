// BAI 18E — migrator.up(): chay file migration (da sua tay) len DB
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
    debug: true,
  });
  const conn = orm.em.getConnection();

  // DB THANG 1: cot ho_ten, sdt — da co 3 khach
  await conn.execute('create table `khach_hang` (`id` integer not null primary key autoincrement, `ho_ten` text null, `sdt` text null)');
  await conn.execute("insert into `khach_hang` (`ho_ten`, `sdt`) values ('Than', '0901'), ('An', '0902'), ('Binh', '0903')");

  console.log('\n---------- BAT DAU ----------\n');
  console.log('DB truoc khi up:', await conn.execute('select * from `khach_hang`'));

  console.log('\n--- 1. FILE NAO CHUA CHAY? ---');
  console.log(await orm.migrator.getPending());

  console.log('\n--- 2. CHAY migrator.up() ---');
  const daChay = await orm.migrator.up();
  console.log('Vua chay:', daChay);

  console.log('\n--- 2b. CHAY migrator.up() LAN 2 ---');
  console.log('Vua chay:', await orm.migrator.up());

  console.log('\n--- 3. KIEM TRA ---');
  console.log('DB sau khi up:', await conn.execute('select * from `khach_hang`'));
  console.log('Bang mikro_orm_migrations:', await conn.execute('select * from `mikro_orm_migrations`'));

  console.log('\n--- 4. CHAY migrator.down() ---');
  console.log('Vua quay lui:', await orm.migrator.down());

  console.log('\n--- 5. KIEM TRA SAU down ---');
  console.log('DB sau khi down:', await conn.execute('select * from `khach_hang`'));
  console.log('Bang mikro_orm_migrations:', await conn.execute('select * from `mikro_orm_migrations`'));
  console.log('Pending:', await orm.migrator.getPending());

  await orm.close(true);
}
main();
