import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { Bai08Controller } from "./app/controller/bai08";
import { Bai10Controller } from "./app/controller/bai10";
import { PostController } from "./app/controller/post";
import { UserController } from "./app/controller/user";
import { Comment } from "./domain/model/comment";
import { Post } from "./domain/model/post";
import { User } from "./domain/model/user";
import { CommentRepository } from "./domain/repository/comment";
import { PostRepository } from "./domain/repository/post";
import { UserRepository } from "./domain/repository/user";
import { Bai08Service } from "./domain/service/bai08";
import { Bai10Service } from "./domain/service/bai10";
import { PostService } from "./domain/service/post";
import { UserService } from "./domain/service/user";

@Module({
    imports: [MikroOrmModule.forFeature([User, Post, Comment])],
    controllers: [UserController, PostController, Bai08Controller, Bai10Controller],
    providers: [UserRepository, UserService, PostRepository, PostService, CommentRepository, Bai08Service, Bai10Service],
    exports: [UserService, PostService]
})
export class LabModule {}
