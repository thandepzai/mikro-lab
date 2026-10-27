export interface Sort {
    [x: string]: OrderQuery;
}

export enum OrderQuery {
    ASC = "asc",
    DESC = "desc"
}
