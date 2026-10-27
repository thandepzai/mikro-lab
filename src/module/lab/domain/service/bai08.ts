import { wrap } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { PostSummary } from "../config/type/post";
import { Post } from "../model/post";
import { CommentRepository } from "../repository/comment";
import { PostRepository } from "../repository/post";
import { UserRepository } from "../repository/user";

@Injectable()
export class Bai08Service {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly postRepository: PostRepository,
        private readonly commentRepository: CommentRepository
    ) {}

    async seed(userCount = 5, commentPerPost = 3) {
        for (let u = 1; u <= userCount; u++) {
            const user = await this.userRepository.create({ name: `User ${u}`, email: `user${u}@lab.dev` });
            const post = await this.postRepository.create(
                { title: `Post cua User ${u}`, author: user.id },
                { excludeRelation: false }
            );
            for (let c = 1; c <= commentPerPost; c++) {
                await this.commentRepository.create(
                    { title: `Comment ${c} cua Post ${post.id}`, post: post.id },
                    { excludeRelation: false }
                );
            }
        }
        return { users: userCount, posts: userCount, comments: userCount * commentPerPost };
    }

    async findNPlusOne() {
        const posts = await this.postRepository.find({});
        for (const post of posts) {
            await wrap(post.author).init();
            await post.comments.init();
        }
        return posts.map((post) => this.toSummary(post));
    }

    async findPopulated() {
        const posts = await this.postRepository.find({});
        await this.postRepository.populate(posts, { withAuthor: true, withComments: true });
        return posts.map((post) => this.toSummary(post));
    }

    private toSummary(post: Post): PostSummary {
        return {
            id: post.id,
            title: post.title,
            authorName: post.author.name,
            commentCount: post.comments.length
        };
    }
}
