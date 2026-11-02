import { Controller, Get, Post } from "@nestjs/common";
import { Bai11Service } from "../../domain/service/bai11";

@Controller("lab/bai11")
export class Bai11Controller {
    constructor(private readonly bai11Service: Bai11Service) {}

    @Post("khong-bao")
    withoutTransaction() {
        return this.bai11Service.withoutTransaction();
    }

    @Post("co-bao")
    withTransaction() {
        return this.bai11Service.withTransaction();
    }

    @Post("thanh-cong")
    withTransactionSuccess() {
        return this.bai11Service.withTransactionSuccess();
    }

    @Post("long-nhau")
    nestedTransaction() {
        return this.bai11Service.nestedTransaction();
    }

    @Get("users")
    listUsers() {
        return this.bai11Service.listUsers();
    }
}
