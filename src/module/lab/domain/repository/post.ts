import { Loaded } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/postgresql";
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "@module/_core/domain/repository/base.pg";
import { FindPostOption } from "../config/type/post";
import { Post } from "../model/post";

@Injectable()
export class PostRepository extends BaseRepository<Post> {
    constructor(protected readonly em: EntityManager) {
        super(em, Post);
    }

    async populate<T extends Loaded<Post | Post[]>>(post: T, findOption?: FindPostOption) {
        const createPromiseArray = [
            async () => {
                if (findOption?.withAuthor) {
                    await this.em.populate(post as Post, ["author"]);
                }
            },
            async () => {
                if (findOption?.withComments) {
                    await this.em.populate(post as Post, ["comments"]);
                }
            }
        ];

        await Promise.all(createPromiseArray.map((f) => f()));

        return post;
    }
}
