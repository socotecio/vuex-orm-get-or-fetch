import { Item, Collection, Fields } from "@vuex-orm/core";

declare module "@vuex-orm/core" {
  namespace Model {
    export const uuid: string;
    export const $id: string | null;
    export const listAction: string;
    export const retrieveAction: string;
    export const listAllAction: string;

    export function withAll(): Item;
    export function withAllRecursive(depth: number): Item;
    export function withField(withField: string): Item;
    export function $fields(): Fields;
    export function getFromStoreOrFetchBelongsTo(
      belongsToField: string
    ): Promise<Item>;
    export function getFromStoreOrFetchRelated(
      relationField: string,
      uuidList: string[],
      fetchParams: FetchParams
    ): Promise<Collection<Model>>;
  }

  namespace Query {
    export const model: Model;
    export function getFromStoreOrFetchOne(
      uuid: string,
      action: string,
      findByUuid?: boolean
    ): Promise<Item>;

    export function getFromStoreOrFetchMany(
      uuidList: string[],
      fetchParams: FetchParams,
      paginated: boolean,
      action: string
    ): Promise<Collection<Model>>;

    export function getFromStoreOrFetchWhere(
      callbackFn: (item: Model) => boolean,
      fetchParams: FetchParams
    ): Promise<Collection<Model>>;

    export function getFromStoreOrFetchRelated(
      relationField: string,
      uuidList: string[],
      fetchParams: FetchParams
    ): Promise<Collection<Model>>;
  }
}

interface Metadata {
  filters?: string;
  pagination?: string;
}

export declare interface FetchParams {
  metadata: Metadata;
}
