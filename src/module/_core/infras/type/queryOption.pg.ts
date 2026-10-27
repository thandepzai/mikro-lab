import { EntityField } from "@mikro-orm/core";
import { OrderQuery, Sort } from "./sort";

export interface QueryOption<T = any> {
    select?: EntityField<T>[] | string[];
    sort?: Sort;
    order?: OrderQuery;
    page?: number;
    pageSize?: number;
}

export interface CreateOption {
    excludeRelation?: boolean;
}

export interface UpdateOption {
    flush?: boolean;
    excludeRelation?: boolean;
}
