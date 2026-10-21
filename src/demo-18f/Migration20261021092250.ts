import { Migration } from '@mikro-orm/migrations';

export class Migration20261021092250 extends Migration {

  override name = 'Migration20261021092250';

  override up(): void | Promise<void> {
    this.addSql(`alter table \`khach_hang\` add column \`phone\` text null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`khach_hang\` drop column \`phone\`;`);
  }

}
