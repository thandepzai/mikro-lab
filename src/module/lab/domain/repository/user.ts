import { EntityManager } from "@mikro-orm/postgresql";
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "@module/_core/domain/repository/base.pg";
import { User } from "../model/user";

@Injectable()
export class UserRepository extends BaseRepository<User> {
    constructor(protected readonly em: EntityManager) {
        super(em, User);
    }
}
