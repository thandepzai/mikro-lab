import { Injectable } from "@nestjs/common";
import { BaseService } from "@module/_core/domain/service/base.pg";
import { User } from "../model/user";
import { UserRepository } from "../repository/user";

@Injectable()
export class UserService extends BaseService<User> {
    constructor(private readonly userRepository: UserRepository) {
        super(userRepository);
    }
}
