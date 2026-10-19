import { Migration } from '@mikro-orm/migrations';

export class Migration20261017094903 extends Migration {

  override name = 'Migration20261017094903';

  override up(): void | Promise<void> {
    this.addSql(`alter table \`khach_hang\` rename column \`ho_ten\` to \`name\`;`);
    this.addSql(`alter table \`khach_hang\` rename column \`sdt\` to \`phone\`;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`khach_hang\` rename column \`name\` to \`ho_ten\`;`);
    this.addSql(`alter table \`khach_hang\` rename column \`phone\` to \`sdt\`;`);
  }

}
