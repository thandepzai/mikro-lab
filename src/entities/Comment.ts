import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  BeforeCreate,
  BeforeUpdate,
  BeforeDelete,
} from "@mikro-orm/decorators/legacy";
import { Post } from "./Post";

@Entity()
export class Comment {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Post)
  post!: Post;

  @Property({ nullable: true })
  createdAt?: Date;

  @Property({ nullable: true })
  updatedAt?: Date;

  @Property({ nullable: true })
  deletedAt?: Date;

  @BeforeCreate()
  ganCreatedAt() {
    this.createdAt = new Date();
  }

  @BeforeUpdate()
  ganUpdatedAt() {
    this.updatedAt = new Date();
  }
}
