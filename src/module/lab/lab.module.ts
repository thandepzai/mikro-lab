import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { PostController } from "./app/controller/post";
import { UserController } from "./app/controller/user";
import { Comment } from "./domain/model/comment";
import { Post } from "./domain/model/post";
import { User } from "./domain/model/user";
import { PostRepository } from "./domain/repository/post";
import { UserRepository } from "./domain/repository/user";
import { PostService } from "./domain/service/post";
import { UserService } from "./domain/service/user";

@Module({
    imports: [MikroOrmModule.forFeature([User, Post, Comment])],
    controllers: [UserController, PostController],
    providers: [UserRepository, UserService, PostRepository, PostService],
    exports: [UserService, PostService]
})
export class LabModule {}
