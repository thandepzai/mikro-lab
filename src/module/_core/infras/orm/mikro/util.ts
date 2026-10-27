import { MikroORM } from "@mikro-orm/core";

let globalORM: MikroORM;

export function setGlobalORM(orm: MikroORM) {
    globalORM = orm;
}

export async function runInTransaction<T extends unknown[]>(
    ...tasks: { [K in keyof T]: () => Promise<T[K]> }
): Promise<T> {
    if (!globalORM) throw new Error("Global ORM is not set. Call setGlobalORM(orm) first.");

    return globalORM.em.transactional(async () => {
        return Promise.all(tasks.map((task) => task())) as Promise<T>;
    });
}
