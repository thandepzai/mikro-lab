import { Entity, ManyToOne, PrimaryKey, Property, types } from "@mikro-orm/core";
import { BaseEntity } from "@module/_core/domain/entity/baseEntity.pg";
import { Post } from "./post";

@Entity({
    schema: "lab"
})
export class Comment extends BaseEntity {
    @PrimaryKey({ type: types.integer })
    id: number;

    @Property()
    title: string;

    @ManyToOne(() => Post)
    post: Post;

    @Property()
    createdAt: Date = new Date();
}
