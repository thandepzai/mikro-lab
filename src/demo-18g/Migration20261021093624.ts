import { Migration } from '@mikro-orm/migrations';

export class Migration20261021093624 extends Migration {

  override name = 'Migration20261021093624';

  override up(): void | Promise<void> {
    this.addSql(`alter table \`khach_hang\` add column \`email\` text null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`khach_hang\` drop column \`email\`;`);
  }

}
