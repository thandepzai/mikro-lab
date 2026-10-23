// ================================================================
//  ON TAP BAI 18 — MIGRATION (ban de)
//
//  Code da viet san. Viec cua ban moi bai chi co 3 buoc:
//    1. Doc phan "DOAN TRUOC KHI SUA", viet cau tra loi vao sau dau ->
//    2. Chay lenh, so log voi cau doan
//    3. Neu bai co "VIEC CUA BAN" thi sua DUNG cho co dau <- SUA
//  Dap an: src/bai/00d-bai-tap-lon-bai-18/DAP-AN-BAN-DE.md (lam xong moi mo)
//
//  Can Node 22: nvm use
//
//  | Bai | Hoc gi                                   | Lenh                      |
//  |-----|------------------------------------------|---------------------------|
//  | B1  | them cot bat buoc vao bang co du lieu    | npm run dev -- b1         |
//  | B2  | ORM doan doi ten cot                     | npm run dev -- b2         |
//  | B3  | create() chi ghi file, khong dung DB     | npm run dev -- b3         |
//  | B4  | up() / down() va so mikro_orm_migrations | npm run dev -- b4         |
//  | B5  | sua tay file migration cho khong mat data| (sua file roi chay lai b4)|
//  | B6  | snapshot                                 | npm run dev -- b6         |
//  |     |                                          | npm run dev -- b6-deploy  |
//  | B7  | server tu up() luc khoi dong             | npm run dev -- b7 moi     |
//  | B8  | review file migration cua dong nghiep    | npm run dev -- b8         |
//
//  Bang dung chung: san_pham. Ban dau luon co 3 dong: But, Vo, Thuoc.
// ================================================================
import 'reflect-metadata';
import { mkdirSync, rmSync } from 'node:fs';
import { Controller, Get, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroORM, EntityManager, SqliteDriver, EntityClass } from '@mikro-orm/sqlite';
import { Migrator } from '@mikro-orm/migrations';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

// ================================================================
//  B1 — Them cot bat buoc vao bang DA CO du lieu                (on 18A)
//  Lenh: npm run dev -- b1
//
//  DB  : san_pham(id, ten) — 3 dong
//  Code: entity them `gia` (bat buoc). Goi schema.update().
//
//  DOAN TRUOC KHI SUA — code dang nhu nay, chay thi ra gi? co loi gi?
//    1. Cau SQL ORM sinh ra?                       -> alter table `san_pham` add column `gia` integer not null default 0;
//    2. Chay that co loi khong? Vi sao?            -> Không lỗi vì đã thêm default 0 cho cột `gia`, nên các dòng hiện có sẽ được gán giá trị 0.
//
//  VIEC CUA BAN: sua dong <- SUA de het loi va 3 dong cu deu co gia = 0.
// ================================================================
@Entity({ tableName: 'san_pham' })
class SanPhamB1 {
  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  ten?: string;

  @Property({ default: 0 }) // <- SUA
  gia!: number;
}

async function b1() {
  const orm = await moORM(SanPhamB1);
  await taoBangCu(orm, false);

  console.log('SQL ORM sinh ra:', await orm.schema.getUpdateSchemaSQL());
  try {
    await orm.schema.update();
  } catch (e) {
    console.log('LOI:', (e as Error).message);
  }
  await xem(orm, 'Sau schema.update()');
  await orm.close(true);
}

// ================================================================
//  B2 — ORM doan doi ten cot                                    (on 18B, 18C)
//  Lenh: npm run dev -- b2
//
//  DB  : san_pham(id, ten, mo_ta) — 3 dong
//  Code: thu 2 lan, moi lan mot DB moi:
//    Lan 1: doi 1 cot  ten -> tenSp
//    Lan 2: doi 2 cot  ten -> tenSp, moTa -> ghiChu
//
//  DOAN TRUOC KHI SUA — code dang nhu nay, chay thi ra gi? co loi gi?
//    1. Property `tenSp` thanh cot ten gi trong DB?   ->
//    2. Lan 1 ORM sinh SQL gi? Du lieu con khong?     ->
//    3. Lan 2 ORM sinh SQL gi? Du lieu con khong?     ->
//    4. Vi sao 2 lan khac nhau?                       ->
// ================================================================
@Entity({ tableName: 'san_pham' })
class DoiTen1Cot {
  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  tenSp?: string;

  @Property({ nullable: true })
  moTa?: string;
}

@Entity({ tableName: 'san_pham' })
class DoiTen2Cot {
  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  tenSp?: string;

  @Property({ nullable: true })
  ghiChu?: string;
}

async function b2() {
  for (const [nhan, entity] of [['Lan 1: doi 1 cot', DoiTen1Cot], ['Lan 2: doi 2 cot', DoiTen2Cot]] as const) {
    console.log(`\n========== ${nhan} ==========`);
    const orm = await moORM(entity);
    await taoBangCu(orm, true);
    console.log('SQL ORM sinh ra:', await orm.schema.getUpdateSchemaSQL());
    await orm.schema.update();
    await xem(orm, 'Sau schema.update()');
    await orm.close(true);
  }
}

// ================================================================
//  B3 — migrator.create(): chi GHI FILE, khong dung DB          (on 18D)
//  Lenh: npm run dev -- b3
//
//  DB    : san_pham(id, ten, mo_ta) — 3 dong
//  Entity: DoiTen2Cot (giong lan 2 cua B2)
//  Code  : goi create() -> in ten file + up/down -> xem DB.
//  File sinh ra o: src/bt18/b3/MigrationXXXX.ts — mo ra doc.
//
//  DOAN TRUOC KHI SUA — code dang nhu nay, chay thi ra gi? co loi gi?
//    1. up() trong file co cau rename nao khong?        ->
//    2. Sau create(), DB co bi doi khong?               ->
//
//  Chu y: moi lan chay b3 se XOA file cu va sinh file moi (mat luon phan ban sua o B5).
// ================================================================
async function b3() {
  xoaThuMuc('b3');
  const orm = await moORM(DoiTen2Cot, { thuMuc: 'b3' });
  await taoBangCu(orm, true);

  const kq = await orm.migrator.create();
  console.log('File vua sinh:', kq.fileName);
  console.log('up()  :', kq.diff.up);
  console.log('down():', kq.diff.down);

  await xem(orm, 'DB sau create()');
  await orm.close(true);
}

// ================================================================
//  B4 — up() / down() va so mikro_orm_migrations               (on 18E)
//  Lenh: npm run dev -- b4   (chay B3 truoc)
//
//  DB  : san_pham(id, ten, mo_ta) — 3 dong
//  Code: chay file cua B3, CHUA sua gi:
//        xem -> up() -> xem -> up() lan 2 -> xem -> down() -> xem
//
//  DOAN TRUOC KHI SUA — code dang nhu nay, chay thi ra gi? co loi gi?
//    1. Sau up(): so ghi gi? du lieu con khong?         ->
//    2. up() lan 2 chay file nao? Vi sao?               ->
//    3. Sau down(): so ra sao? du lieu quay ve khong?   ->
// ================================================================
async function b4() {
  const orm = await moORM(DoiTen2Cot, { thuMuc: 'b3' });
  await taoBangCu(orm, true);
  await vongTron(orm);
  await orm.close(true);
}

// ================================================================
//  B5 — Sua tay file migration                                  (on 18E + review)
//  Khong co lenh rieng: sua file roi chay lai  npm run dev -- b4
//
//  VIEC CUA BAN: mo src/bt18/b3/MigrationXXXX.ts
//    - Thay 4 cau trong up()   bang 2 cau rename (ten -> ten_sp, mo_ta -> ghi_chu)
//    - Thay 4 cau trong down() bang 2 cau rename nguoc lai
//    Mau: alter table `san_pham` rename column `cu` to `moi`;
//
//  YEU CAU: ca 4 lan xem deu con du But/Viet xanh, Vo/100 trang, Thuoc/30cm.
// ================================================================

// ================================================================
//  B6 — Snapshot                                                (on 18F)
//  Lenh: npm run dev -- b6          (dev sinh file 3 buoi)
//        npm run dev -- b6-deploy   (server chay 2 file do len DB trong)
//
//  DB ':memory:' -> moi buoi la mot DB TRONG TRON, khong ai up() o giua.
//    SANG : entity (id, ten)        -> create()
//    CHIEU: them `gia`              -> create()
//    TOI  : khong sua gi            -> create()
//  b6-deploy phai la lenh rieng vi up() doc file da compile trong dist/.
//
//  DOAN TRUOC KHI SUA (DUNG_SNAPSHOT = true) — chay thi ra gi? co loi gi?
//    1. SANG sinh gi?                                  ->
//    2. CHIEU sinh gi? (DB van trong!)                 ->
//    3. TOI sinh gi?                                   ->
//    4. b6-deploy: up() co chay duoc ca 2 file khong?  ->
//
//  VIEC CUA BAN: doi DUNG_SNAPSHOT = false, chay lai b6 roi b6-deploy.
//    5. CHIEU sinh gi? b6-deploy loi gi? Vi sao?       ->
//  Xong nho doi lai true va chay lai b6 (B7 dung file cua B6).
// ================================================================
const DUNG_SNAPSHOT = true; // <- SUA

@Entity({ tableName: 'san_pham' })
class SanPhamSang {
  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  ten?: string;
}

@Entity({ tableName: 'san_pham' })
class SanPhamChieu {
  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  ten?: string;

  @Property({ nullable: true })
  gia?: number;
}

async function b6() {
  xoaThuMuc('b6');
  for (const [nhan, entity] of [['SANG', SanPhamSang], ['CHIEU', SanPhamChieu], ['TOI', SanPhamChieu]] as const) {
    console.log(`\n========== ${nhan} ==========`);
    const orm = await moORM(entity, { thuMuc: 'b6', snapshot: DUNG_SNAPSHOT });
    const kq = await orm.migrator.create();
    console.log('File vua sinh:', kq.fileName || '(khong sinh file)');
    console.log('up():', kq.diff.up);
    await orm.close(true);
    await doi1Giay();
  }
}

async function b6Deploy() {
  const orm = await moORM(SanPhamChieu, { thuMuc: 'b6', snapshot: DUNG_SNAPSHOT });
  console.log('File cho chay:', (await orm.migrator.getPending()).map(m => m.name));
  try {
    const daChay = await orm.migrator.up();
    console.log('up() da chay:', daChay.map(m => m.name));
  } catch (e) {
    console.log('LOI:', (e as Error).message);
  }
  await xem(orm, 'Server sau up()');
  await orm.close(true);
}

// ================================================================
//  B7 — Server NestJS tu up() luc khoi dong                     (on 18G)
//  Dung 2 file cua B6. DB server: db-bt18/server.sqlite, GIU LAI giua cac lan chay.
//  Server: khoi dong -> up() -> listen -> goi GET /san-pham/them 1 lan.
//
//  DOAN TRUOC KHI SUA (moi lan: file cho chay / up() chay gi / tra ve gi / co loi gi?):
//    Lan 1: npm run dev -- b7 moi    (xoa DB, server moi)    ->
//    Lan 2: npm run dev -- b7        (khoi dong lai, giu DB) ->
//
//  VIEC CUA BAN: doi CHAY_UP = false, chay  npm run dev -- b7 moi
//    Lan 3: loi gi? Vi sao?                                  ->
//  Xong nho doi lai true.
// ================================================================
const CHAY_UP = true; // <- SUA

@Controller('san-pham')
class SanPhamController {
  constructor(private readonly em: EntityManager) {}

  @Get('them')
  async them() {
    this.em.create(SanPhamChieu, { ten: 'But', gia: 5000 });
    await this.em.flush();
    return this.em.find(SanPhamChieu, {});
  }
}

@Module({
  imports: [
    MikroOrmModule.forRoot({
      driver: SqliteDriver,
      entities: [SanPhamChieu],
      dbName: 'db-bt18/server.sqlite',
      metadataProvider: ReflectMetadataProvider,
      extensions: [Migrator],
      migrations: { path: 'dist/bt18/b6', pathTs: 'src/bt18/b6' },
    }),
  ],
  controllers: [SanPhamController],
})
class AppModule {}

async function b7(moi: boolean) {
  if (moi) rmSync('db-bt18/server.sqlite', { force: true });

  const app = await NestFactory.create(AppModule, { logger: ['error'] });
  const orm = app.get(MikroORM);
  console.log('File cho chay:', (await orm.migrator.getPending()).map(m => m.name));
  if (CHAY_UP) {
    const daChay = await orm.migrator.up();
    console.log('up() da chay:', daChay.map(m => m.name));
  }
  await app.listen(3000);

  const res = await fetch('http://localhost:3000/san-pham/them');
  console.log('Tra ve:', res.status, await res.json());
  await app.close();
}

// ================================================================
//  B8 — Review file cua dong nghiep                             (on ca bai 18)
//  Lenh: npm run dev -- b8
//
//  Dong nghiep doi entity thanh SanPhamB8 (ten -> tenSp, moTa -> ghiChu, them gia bat buoc)
//  va tu viet tay file: src/bt18/b8/Migration20261021120000.ts
//  DB server: san_pham(id, ten, mo_ta) — 3 dong.
//
//  Buoc 1: CHI DOC file, chua chay. Tim 3 loi. Goi y — hoi 3 cau:
//    - Co `not null` khong? 3 dong cu se dien gi?        -> loi 1:
//    - Co `drop` khong? Du lieu cot do di dau?           -> loi 2:
//    - down() co tra DB ve DUNG nhu cu khong?            -> loi 3:
//  Buoc 2: chay b8, xem log co dung loi ban tim khong.
//  Buoc 3: sua file, chay lai den khi pass.
//    (up() loi giua chung la ca file bi huy, nen sua xong loi nay moi lo loi sau)
//
//  YEU CAU:
//    - Ca 4 lan xem con du 3 dong, khong mat mo ta (Viet xanh, 100 trang, 30cm)
//    - Sau up(): cot id, ten_sp, ghi_chu, gia — Sau down(): ve dung id, ten, mo_ta
//    - Khong co dong LOI nao
// ================================================================
@Entity({ tableName: 'san_pham' })
class SanPhamB8 {
  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  tenSp?: string;

  @Property({ nullable: true })
  ghiChu?: string;

  @Property({ default: 0 })
  gia!: number;
}

async function b8() {
  const orm = await moORM(SanPhamB8, { thuMuc: 'b8' });
  await taoBangCu(orm, true);
  await vongTron(orm);
  await orm.close(true);
}

// ================================================================
//  HAM CO SAN — khong can doc
// ================================================================
interface TuyChon {
  dbName?: string;
  thuMuc?: string;
  snapshot?: boolean;
}

function moORM(entity: EntityClass<object>, { dbName = ':memory:', thuMuc = 'chung', snapshot = false }: TuyChon = {}) {
  return MikroORM.init({
    entities: [entity],
    dbName,
    metadataProvider: ReflectMetadataProvider,
    extensions: [Migrator],
    migrations: { path: `dist/bt18/${thuMuc}`, pathTs: `src/bt18/${thuMuc}`, snapshot },
  });
}

type ORM = Awaited<ReturnType<typeof moORM>>;

async function taoBangCu(orm: ORM, coMoTa: boolean) {
  const conn = orm.em.getConnection();
  if (coMoTa) {
    await conn.execute('create table `san_pham` (`id` integer not null primary key autoincrement, `ten` text null, `mo_ta` text null)');
    await conn.execute("insert into `san_pham` (`ten`, `mo_ta`) values ('But', 'Viet xanh'), ('Vo', '100 trang'), ('Thuoc', '30cm')");
  } else {
    await conn.execute('create table `san_pham` (`id` integer not null primary key autoincrement, `ten` text null)');
    await conn.execute("insert into `san_pham` (`ten`) values ('But'), ('Vo'), ('Thuoc')");
  }
}

async function xem(orm: ORM, nhan: string) {
  const conn = orm.em.getConnection();
  const cot = ((await conn.execute('pragma table_info(san_pham)')) as { name: string }[]).map(c => c.name);
  let so: string[] | string = '(chua co bang so)';
  try {
    so = ((await conn.execute('select `name` from `mikro_orm_migrations`')) as { name: string }[]).map(r => r.name);
  } catch {}
  console.log(`\n--- ${nhan} ---`);
  console.log('Cot:', cot.length ? cot.join(', ') : '(chua co bang san_pham)');
  const dong = cot.length ? await conn.execute('select * from `san_pham`') : [];
  if (dong.length) console.table(dong);
  else if (cot.length) console.log('Dong: (bang trong)');
  console.log('So :', so);
}

async function vongTron(orm: ORM) {
  const buoc = async (nhan: string, chay: () => Promise<{ name: string }[]>) => {
    try {
      console.log(`\n>>> ${nhan} da chay:`, (await chay()).map(m => m.name));
    } catch (e) {
      console.log(`\n>>> ${nhan} LOI:`, (e as Error).message);
    }
    await xem(orm, `Sau ${nhan}`);
  };
  await xem(orm, 'Ban dau');
  await buoc('up()', () => orm.migrator.up());
  await buoc('up() lan 2', () => orm.migrator.up());
  await buoc('down()', () => orm.migrator.down());
}

function xoaThuMuc(thuMuc: string) {
  rmSync(`src/bt18/${thuMuc}`, { recursive: true, force: true });
  rmSync(`dist/bt18/${thuMuc}`, { recursive: true, force: true });
}

function doi1Giay() {
  return new Promise(r => setTimeout(r, 1100));
}

mkdirSync('db-bt18', { recursive: true });
const [lenh, thamSo] = process.argv.slice(2);
const bang: Record<string, () => Promise<void>> = {
  b1,
  b2,
  b3,
  b4,
  b6,
  'b6-deploy': b6Deploy,
  b7: () => b7(thamSo === 'moi'),
  b8,
};
const chay = bang[lenh];
if (chay) chay();
else console.log('Chay: npm run dev -- <lenh>. Lenh:', Object.keys(bang).join(' | '));
