export interface FindPostOption {
    withAuthor?: boolean;
    withComments?: boolean;
}

export interface PostSummary {
    id: number;
    title: string;
    authorName: string;
    commentCount: number;
}
