import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  email!: string;

}
