import { Collection } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property, OneToMany } from '@mikro-orm/decorators/legacy';
import { Post } from './Post';

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  email!: string;

  @OneToMany(() => Post, post => post.author)
  posts = new Collection<Post>(this);

}
