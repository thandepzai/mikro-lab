import { Migration } from '@mikro-orm/migrations';

export class Migration20261021092249 extends Migration {

  override name = 'Migration20261021092249';

  override up(): void | Promise<void> {
    this.addSql(`create table \`khach_hang\` (\`id\` integer not null primary key autoincrement, \`name\` text null);`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists \`khach_hang\`;`);
  }

}
