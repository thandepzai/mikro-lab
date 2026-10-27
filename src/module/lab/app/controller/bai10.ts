import { Controller, Get } from "@nestjs/common";
import { Bai10Service } from "../../domain/service/bai10";

@Controller("lab/bai10")
export class Bai10Controller {
    constructor(private readonly bai10Service: Bai10Service) {}

    @Get("posts-per-user")
    postsPerUser() {
        return this.bai10Service.countPostsPerUser();
    }
}
