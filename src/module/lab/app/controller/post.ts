import { Body, Controller, Get, Post } from "@nestjs/common";
import { CreatePostDto } from "../../domain/dto/createPost.dto";
import { PostService } from "../../domain/service/post";

@Controller("lab/posts")
export class PostController {
    constructor(private readonly postService: PostService) {}

    @Get()
    async find() {
        const posts = await this.postService.find({});
        return posts.map((post) => post.serialize());
    }

    @Post()
    async create(@Body() body: CreatePostDto) {
        const post = await this.postService.createWithAuthor(body);
        return post.serialize();
    }
}
