import { Injectable } from "@nestjs/common";
import { UserRepository } from "../repository/user";

@Injectable()
export class Bai10Service {
    constructor(private readonly userRepository: UserRepository) {}

    countPostsPerUser() {
        return this.userRepository.countPostsPerUser();
    }
}
