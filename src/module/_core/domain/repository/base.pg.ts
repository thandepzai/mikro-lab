import { cleanObject } from "@base/util/functions";
import {
    EntityClass,
    EntityData,
    EntityManager,
    EntityName,
    EntityRepository,
    FilterQuery,
    FindOneOptions,
    FindOptions,
    Loaded,
    QueryBuilder,
    QueryOrderMap,
    RequiredEntityData,
    wrap
} from "@mikro-orm/postgresql";
import { CreateOption, QueryOption, UpdateOption } from "@module/_core/infras/type/queryOption.pg";

type AssignData<T extends object> = Parameters<ReturnType<typeof wrap<T>>["assign"]>[0];

export class BaseRepository<
    Entity extends object,
    CreateEntityDTO = RequiredEntityData<Entity>,
    UpdateEntityDTO = EntityData<Entity>
> {
    readonly raw: EntityRepository<Entity>;
    readonly qb: (alias?: string) => QueryBuilder<Entity>;

    constructor(
        protected readonly em: EntityManager,
        readonly entity: EntityName<Entity>
    ) {
        this.raw = em.getRepository(entity) as EntityRepository<Entity>;
        this.qb = (alias?: string) => em.qb(entity, alias);
    }

    getQueryOption(queryOptions: QueryOption<Entity> = {}) {
        const options: FindOptions<Entity> = {};
        const qO = cleanObject(queryOptions);

        if (qO.sort) options.orderBy = qO.sort as QueryOrderMap<Entity>;
        if (qO.page >= 0) options.offset = (qO.page - 1) * qO.pageSize;
        if (qO.pageSize >= 0) options.limit = qO.pageSize;
        if (qO.select) options.fields = qO.select as FindOptions<Entity>["fields"];

        return options;
    }

    async find(filterQuery: FilterQuery<Entity>, queryOption?: QueryOption<Entity>) {
        return this.raw.find(filterQuery, this.getQueryOption(queryOption));
    }

    async findOne(filterQuery: FilterQuery<Entity>, queryOption?: QueryOption<Entity>) {
        return this.raw.findOne(filterQuery, this.getQueryOption(queryOption) as FindOneOptions<Entity>);
    }

    build(createDataDTO: CreateEntityDTO, { excludeRelation = true }: CreateOption = {}): Entity {
        return this.raw.create(
            cleanObject({
                ...createDataDTO,
                ...this.createHiddenRelationObject(excludeRelation)
            }) as unknown as RequiredEntityData<Entity>
        );
    }

    async create(createDataDTO: CreateEntityDTO, createOption: CreateOption = {}): Promise<Entity> {
        const entity = this.build(createDataDTO, createOption);
        await this.em.persistAndFlush(entity);
        return entity;
    }

    async save(entity: Loaded<Entity>): Promise<Entity> {
        await this.em.persistAndFlush(entity);
        return entity;
    }

    async update(filterQuery: FilterQuery<Entity>, updateDataDTO: UpdateEntityDTO): Promise<boolean> {
        await this.raw.nativeUpdate(filterQuery, updateDataDTO as EntityData<Entity>);
        return true;
    }

    async updateEntity<T extends Loaded<Entity>>(
        entity: T,
        updateDataDTO: UpdateEntityDTO,
        { flush = true, excludeRelation = true }: UpdateOption = {}
    ) {
        if (!entity) return entity;

        const updated = wrap(entity).assign(
            cleanObject({
                ...updateDataDTO,
                ...this.createHiddenRelationObject(excludeRelation)
            }) as AssignData<T>
        );

        if (flush) await this.em.flush();
        return updated;
    }

    async findOneAndUpdate(
        filterQuery: FilterQuery<Entity>,
        updateDataDTO: UpdateEntityDTO,
        options?: QueryOption<Entity> & UpdateOption
    ) {
        const entity = await this.findOne(filterQuery, options);
        if (!entity) return null;
        return this.updateEntity(entity, updateDataDTO, options);
    }

    async findOneAnDelete(filterQuery: FilterQuery<Entity>, options = { flush: true }): Promise<Entity> {
        const entity = await this.raw.findOne(filterQuery);
        if (!entity) return null;
        if (options.flush) await this.em.remove(entity).flush();
        return entity;
    }

    async deleteEntity(entity: Loaded<Entity>) {
        if (!entity) return;
        await this.em.removeAndFlush(entity);
        return true;
    }

    async delete(filterQuery: FilterQuery<Entity>) {
        await this.raw.nativeDelete(filterQuery);
        return true;
    }

    private createHiddenRelationObject(hide = true) {
        const hideRelation: Record<string, undefined> = {};

        if (hide) {
            const meta = this.em.getMetadata().get((this.entity as EntityClass<Entity>).name);

            Object.entries(meta.properties).forEach(([key, prop]) => {
                if (prop.entity && !prop.embeddable) hideRelation[key] = undefined;
            });
        }

        return hideRelation;
    }
}
