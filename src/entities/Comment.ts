import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
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
}
