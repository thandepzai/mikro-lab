import { IsInt, IsString } from "class-validator";

export class CreatePostDto {
    @IsString()
    title: string;

    @IsInt()
    authorId: number;
}
