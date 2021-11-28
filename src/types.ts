export type Nullable<T> = {
    [K in keyof T]: T[K] | null;
};

export type NullableUndefined<T> = {
    [K in keyof T]: undefined extends T[K] ? T[K] | null : T[K]
}

export interface PagedResult<T> {
    items: T[];
    total: number;
    pageSize: number;
    pageCount: number;
    pageNumber: number;
    hasNext: boolean;
    hasPrevious: boolean;
}