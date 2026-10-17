import { Migration } from '@mikro-orm/migrations';

export class Migration20261017094903 extends Migration {

  override name = 'Migration20261017094903';

  override up(): void | Promise<void> {
    this.addSql(`alter table \`khach_hang\` drop column \`ho_ten\`;`);
    this.addSql(`alter table \`khach_hang\` drop column \`sdt\`;`);
    this.addSql(`alter table \`khach_hang\` add column \`name\` text null;`);
    this.addSql(`alter table \`khach_hang\` add column \`phone\` text null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`khach_hang\` drop column \`name\`;`);
    this.addSql(`alter table \`khach_hang\` drop column \`phone\`;`);
    this.addSql(`alter table \`khach_hang\` add column \`ho_ten\` TEXT null;`);
    this.addSql(`alter table \`khach_hang\` add column \`sdt\` TEXT null;`);
  }

}
