import { Controller, Get, Post } from "@nestjs/common";
import { Bai08Service } from "../../domain/service/bai08";

@Controller("lab/bai08")
export class Bai08Controller {
    constructor(private readonly bai08Service: Bai08Service) {}

    @Post("seed")
    seed() {
        return this.bai08Service.seed();
    }

    @Get("n-plus-1")
    nPlusOne() {
        return this.bai08Service.findNPlusOne();
    }

    @Get("populated")
    populated() {
        return this.bai08Service.findPopulated();
    }
}
