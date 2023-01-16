import { Item, Query } from "@vuex-orm/core";
import { Model } from "@vuex-orm/core";
import { Collection } from "@vuex-orm/core";
import { FetchParams } from "./types/vuex-orm";

export const fetchMap = {};

export const addToFetchMap = async (
  promise: Promise<any>,
  ...uuids: string[]
) => {
  uuids.forEach((uuid) => {
    fetchMap[uuid] = promise;
  });
  try {
    await promise;
  } catch (e) {
    uuids.forEach((uuid) => {
      delete fetchMap[uuid];
    });
    throw e;
  }
};

const fetch = async ({ store, action, payload }: any) => {
  return await store.dispatch(action, payload);
};

export const getFromStoreOrFetchOne = async ({
  query,
  uuid,
  action,
  findByUuid = true,
}: {
  query: Query;
  uuid: string;
  action: string;
  findByUuid?: boolean;
}): Promise<Item> => {
  const find = (uuidValue: string): Item =>
    findByUuid ? query.withAll().find(uuidValue) : query.withAll().first();
  if (find(uuid) === null)
    if (fetchMap[uuid]) {
      await fetchMap[uuid];
    } else {
      await addToFetchMap(
        fetch({
          store: query.store,
          action,
          payload: uuid,
        }),
        uuid
      );
    }
  return find(uuid);
};

export const getFromStoreOrFetchWhere = async ({
  query,
  callbackFn,
  action,
  fetchParams,
}: {
  query: Query;
  callbackFn: (item: Model) => boolean;
  action: string;
  fetchParams: FetchParams;
}): Promise<Collection<Model>> => {
  const filterMany = (filterFn: (item: Model) => boolean) =>
    query
      .where((item: Model) => filterFn(item))
      .withAll()
      .get();

  if (!filterMany(callbackFn).length) {
    await fetch({ store: query.store, action, payload: fetchParams });
  }
  return filterMany(callbackFn);
};

export const getFromStoreOrFetchMany = async ({
  query,
  uuidList,
  action,
  fetchParams,
}: {
  query: Query;
  uuidList: string[];
  action: string;
  fetchParams: FetchParams;
}): Promise<Collection<Model>> => {
  uuidList = [...new Set(uuidList)];

  const getMany = (uuids: string[]) => query.whereIdIn(uuids).withAll().get();

  const inStoreUuids = getMany(uuidList).map(({ uuid }: any) => uuid);
  if (inStoreUuids.length !== uuidList.length) {
    const notInFetchMapUuid = uuidList.filter(
      (uuid: string) => !fetchMap[uuid]
    );

    await addToFetchMap(
      fetch({
        store: query.store,
        action,
        payload: fetchParams ?? {
          metadata: {
            filters: JSON.stringify({
              uuid__in: notInFetchMapUuid
                .filter((uuid: string) => !inStoreUuids.includes(uuid))
                .join(),
            }),
          },
        },
      }),
      ...notInFetchMapUuid
    );

    await Promise.all(
      Object.entries(fetchMap)
        .filter(([uuid]) => uuidList.includes(uuid))
        .map(([, promise]) => promise)
    );
  }
  return getMany(uuidList);
};
