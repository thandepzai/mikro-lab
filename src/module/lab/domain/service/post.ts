import { Injectable } from "@nestjs/common";
import { BaseService } from "@module/_core/domain/service/base.pg";
import { CreatePostDto } from "../dto/createPost.dto";
import { Post } from "../model/post";
import { PostRepository } from "../repository/post";

@Injectable()
export class PostService extends BaseService<Post> {
    constructor(private readonly postRepository: PostRepository) {
        super(postRepository);
    }

    createWithAuthor({ title, authorId }: CreatePostDto) {
        return this.postRepository.create({ title, author: authorId }, { excludeRelation: false });
    }
}
