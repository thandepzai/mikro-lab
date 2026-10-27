import { EntityManager } from "@mikro-orm/postgresql";
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "@module/_core/domain/repository/base.pg";
import { Post } from "../model/post";

@Injectable()
export class PostRepository extends BaseRepository<Post> {
    constructor(protected readonly em: EntityManager) {
        super(em, Post);
    }
}
