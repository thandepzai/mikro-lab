import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  OneToMany,
} from "@mikro-orm/decorators/legacy";
import { User } from "./User";
import { Comment } from "./Comment";
import { Collection, type Ref } from "@mikro-orm/core";

@Entity()
export class Post {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => User, { ref: true })
  author!: Ref<User>;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments = new Collection<Comment>(this);
}
