import { Collection, Entity, Enum, ManyToOne, OneToMany, PrimaryKey, Property, types } from "@mikro-orm/core";
import { BaseEntity } from "@module/_core/domain/entity/baseEntity.pg";
import { PostStatus } from "../config/postStatus";
import { Comment } from "./comment";
import { User } from "./user";

@Entity({
    schema: "lab"
})
export class Post extends BaseEntity {
    @PrimaryKey({ type: types.integer })
    id: number;

    @Property()
    title: string;

    @ManyToOne(() => User)
    author: User;

    @OneToMany(() => Comment, (comment) => comment.post, { hidden: true })
    comments = new Collection<Comment>(this, undefined, false);

    @Enum({ items: () => PostStatus, default: PostStatus.ACTIVE })
    status: PostStatus = PostStatus.ACTIVE;

    @Property()
    createdAt: Date = new Date();

    @Property()
    updatedAt: Date = new Date();
}
