import { FilterQuery, RequiredEntityData } from "@mikro-orm/core";
import { cleanObject } from "@base/util/functions";
import { BaseRepository } from "@module/_core/domain/repository/base.pg";
import { QueryOption } from "@module/_core/infras/type/queryOption.pg";

export interface ICreateOption<Entity> {
    checkExistData?: FilterQuery<Entity>;
}

export class BaseService<Entity extends object, CreateDataDTO extends object = object, UpdateDataDTO extends object = object> {
    constructor(private readonly repository: BaseRepository<Entity, CreateDataDTO, UpdateDataDTO>) {}

    getRepository() {
        return this.repository;
    }

    async find(filter: FilterQuery<Entity>, queryOption?: QueryOption<Entity>) {
        return this.repository.find(filter, queryOption);
    }

    async findOne(filter: FilterQuery<Entity>, queryOption?: QueryOption<Entity>) {
        return this.repository.findOne(filter, queryOption);
    }

    build(createDataDTO: CreateDataDTO): Entity {
        return this.repository.build(createDataDTO);
    }

    async create(createDataDTO: CreateDataDTO, options?: ICreateOption<Entity>): Promise<Entity> {
        const { checkExistData } = options || {};

        if (checkExistData) {
            const existingEntity = await this.repository.findOne(checkExistData);
            if (existingEntity) throw new Error("Document existing");
        }

        return this.repository.create(cleanObject(createDataDTO) as CreateDataDTO);
    }

    async update(filter: FilterQuery<Entity>, updateDataDTO: UpdateDataDTO): Promise<boolean> {
        return this.repository.update(filter, cleanObject(updateDataDTO) as UpdateDataDTO);
    }

    async findOneAndUpdate(filter: FilterQuery<Entity>, updateDataDTO: UpdateDataDTO): Promise<Entity> {
        return this.repository.findOneAndUpdate(filter, cleanObject(updateDataDTO) as UpdateDataDTO) as Promise<Entity>;
    }

    async delete(filter: FilterQuery<Entity>): Promise<boolean> {
        return this.repository.delete(filter);
    }

    async findOneAndDelete(filter: FilterQuery<Entity>) {
        return this.repository.findOneAnDelete(filter);
    }
}
