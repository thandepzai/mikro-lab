import { Collection, Entity, OneToMany, PrimaryKey, Property, types } from "@mikro-orm/core";
import { BaseEntity } from "@module/_core/domain/entity/baseEntity.pg";
import { Post } from "./post";

@Entity({
    schema: "lab"
})
export class User extends BaseEntity {
    @PrimaryKey({ type: types.integer })
    id: number;

    @Property()
    name: string;

    @Property({ hidden: true })
    email: string;

    @OneToMany(() => Post, (post) => post.author, { hidden: true })
    posts = new Collection<Post>(this, undefined, false);

    @Property()
    createdAt: Date = new Date();

    @Property()
    updatedAt: Date = new Date();
}
