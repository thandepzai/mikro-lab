import { RequestContext, wrap } from "@mikro-orm/core";

export abstract class BaseEntity {
    serialize() {
        return wrap(this).toObject();
    }

    getEm() {
        return RequestContext.getEntityManager();
    }

    persist() {
        return this.getEm().persist(this);
    }

    async persistAndFlush() {
        await this.getEm().persistAndFlush(this);
        return this;
    }
}
