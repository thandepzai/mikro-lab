import { Body, Controller, Get, Param, ParseIntPipe, Post } from "@nestjs/common";
import { CreateUserDto } from "../../domain/dto/createUser.dto";
import { UserService } from "../../domain/service/user";

@Controller("lab/users")
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get()
    async find() {
        const users = await this.userService.find({});
        return users.map((user) => user.serialize());
    }

    @Get(":id")
    async findOne(@Param("id", ParseIntPipe) id: number) {
        const user = await this.userService.findOne({ id });
        return user?.serialize();
    }

    @Post()
    async create(@Body() body: CreateUserDto) {
        const user = await this.userService.create(body);
        return user.serialize();
    }
}
