import { Migration } from '@mikro-orm/migrations';

export class Migration20261021120000 extends Migration {

  override name = 'Migration20261021120000';

  override up(): void | Promise<void> {
    this.addSql(`alter table \`san_pham\` add column \`gia\` integer not null;`);
    this.addSql(`alter table \`san_pham\` drop column \`mo_ta\`;`);
    this.addSql(`alter table \`san_pham\` add column \`ghi_chu\` text null;`);
    this.addSql(`alter table \`san_pham\` rename column \`ten\` to \`ten_sp\`;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`san_pham\` drop column \`gia\`;`);
    this.addSql(`alter table \`san_pham\` drop column \`ghi_chu\`;`);
    this.addSql(`alter table \`san_pham\` add column \`mo_ta\` text null;`);
  }

}
