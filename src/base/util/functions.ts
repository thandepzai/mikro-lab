export function cleanObject<T extends object>(obj: T, dirtyValues: unknown[] = [undefined]): Partial<T> {
    const result: Partial<T> = {};
    for (const key of Object.keys(obj) as (keyof T)[]) {
        if (!dirtyValues.includes(obj[key])) result[key] = obj[key];
    }
    return result;
}
