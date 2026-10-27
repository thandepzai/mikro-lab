import { EntityManager, raw } from "@mikro-orm/postgresql";
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "@module/_core/domain/repository/base.pg";
import { UserPostCount } from "../config/type/user";
import { User } from "../model/user";

@Injectable()
export class UserRepository extends BaseRepository<User> {
    constructor(protected readonly em: EntityManager) {
        super(em, User);
    }

    async countPostsPerUser() {
        return this.qb("u")
            .select(["u.id", "u.name", raw("count(p.id)::int as post_count")])
            .leftJoin("u.posts", "p")
            .groupBy("u.id")
            .orderBy({ id: "asc" })
            .execute<UserPostCount[]>();
    }
}
