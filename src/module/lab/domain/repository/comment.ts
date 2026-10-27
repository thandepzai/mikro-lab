import { EntityManager } from "@mikro-orm/postgresql";
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "@module/_core/domain/repository/base.pg";
import { Comment } from "../model/comment";

@Injectable()
export class CommentRepository extends BaseRepository<Comment> {
    constructor(protected readonly em: EntityManager) {
        super(em, Comment);
    }
}
