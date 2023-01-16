import {
  BelongsTo,
  Relation,
  Model,
  Collection,
  Query,
  Item,
} from "@vuex-orm/core";
import { Store } from "vuex";

interface UUIDModel extends Model {
  uuid: string;
}

const fetchMap: { [uuid: string]: Promise<any> } = {};

const addToFetchMap = async (promise: Promise<any>, ...uuids: string[]) => {
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

const fetch = async ({
  store,
  action,
  payload,
}: {
  store: Store<any>;
  action: string;
  payload: any;
}) => {
  return await store.dispatch(action, payload);
};

const getFromStoreOrFetchOne = async <M extends UUIDModel>({
  query,
  uuid,
  action,
  findByUuid = true,
}: {
  query: Query<M>;
  uuid: string;
  action: string;
  findByUuid?: boolean;
}) => {
  const find = (uuidValue: string) =>
    findByUuid ? query.withAll().find(uuidValue) : query.withAll().first();
  if (find(uuid) === null)
    if (fetchMap.hasOwnProperty(uuid)) {
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

const getFromStoreOrFetchWhere = async <M extends UUIDModel>({
  query,
  callbackFn,
  action,
  fetchParams,
}: {
  query: Query<any>;
  callbackFn: (item: any) => any;
  action: string;
  fetchParams?: any;
}): Promise<Collection<M>> => {
  const filterMany = (filterFn: (item: any) => any) =>
    query
      .where((item: any) => filterFn(item))
      .withAll()
      .get();

  if (!filterMany(callbackFn).length) {
    await fetch({ store: query.store, action, payload: fetchParams });
  }
  return filterMany(callbackFn);
};

const getFromStoreOrFetchMany = async <M extends UUIDModel>({
  query,
  uuidList,
  action,
  fetchParams,
}: {
  query: Query<M>;
  uuidList: string[];
  action: string;
  fetchParams?: any;
}): Promise<Collection<M>> => {
  uuidList = [...new Set(uuidList)];

  const getMany = (uuids: string[]) => query.whereIdIn(uuids).withAll().get();

  const inStoreUuids = getMany(uuidList).map(({ uuid }) => uuid);
  if (inStoreUuids.length !== uuidList.length) {
    const uuidsToFetch = uuidList.filter(
      (uuid: string) => !inStoreUuids.includes(uuid) && !fetchMap[uuid]
    );

    if (uuidsToFetch.length)
      await addToFetchMap(
        fetch({
          store: query.store,
          action,
          payload: fetchParams ?? {
            metadata: {
              filters: JSON.stringify({
                uuid__in: uuidsToFetch,
              }),
            },
          },
        }),
        ...uuidsToFetch
      );

    await Promise.all(
      Object.entries(fetchMap)
        .filter(([uuid]) => uuidList.includes(uuid))
        .map(([, promise]) => promise)
    );
  }
  return getMany(uuidList);
};

export default {
  install(components: any) {
    /**
     * Query for a model instance or dispatch a store action if none found
     * By default, uses the model `retrieveAction` and looks for a matching uuid.
     * If findByUuid is false, looks for the first instance of the query
     * example:
     * const building = await AosBuilding.query().getFromStoreOrFetchOne(someUuid);
     */
    components.Query.prototype.getFromStoreOrFetchOne = async function (
      uuid: string,
      action: string,
      findByUuid = true
    ): Promise<Item<Model>> {
      if (!action) {
        action = this.model.retrieveAction;
      }
      if (!action) {
        throw new Error(
          `Vuex grpc Retrieve Action not found in model ${this.model.name}`
        );
      }
      try {
        return await getFromStoreOrFetchOne({
          query: this,
          uuid,
          action,
          findByUuid,
        });
      } catch (error) {
        console.error(
          error,
          `Failed to resolve ${this.baseModel.name}.getFromStoreOrFetchOne : ${uuid}`
        );
        throw error;
      }
    };

    /**
     * Query for multiple model instance or dispatch a store action
     * example:
     * const building = await AosBuilding.query().getFromStoreOrFetchMany([someUuids]);
     */
    components.Query.prototype.getFromStoreOrFetchMany = async function (
      uuidList: string[],
      fetchParams: any,
      paginated = true,
      action: string
    ): Promise<Collection<Model>> {
      const { listAction, listAllAction } = this.model;
      if (!action) {
        if (!listAction && !listAllAction) {
          throw new Error(
            `Vuex grpc List Action not found in model ${this.model.name}`
          );
        }
        action = paginated ? listAction : listAllAction;
      }
      try {
        return await getFromStoreOrFetchMany({
          query: this,
          uuidList,
          action,
          fetchParams,
        });
      } catch (error) {
        console.error(
          error,
          `Failed to resolve ${this.baseModel.name}.getFromStoreOrFetchMany : ${uuidList}`
        );
        throw error;
      }
    };

    /**
     * Query for a collection of filtered model instances or dispatch a store action
     * example:
     * const building = await AosBuilding.query().getFromStoreOrFetchWhere((building) => building.path === somePath)
     */
    components.Query.prototype.getFromStoreOrFetchWhere = async function (
      callbackFn: () => any,
      fetchParams: any
    ): Promise<Collection<Model> | void> {
      const { listAction } = this.model;
      if (!listAction) {
        throw new Error(
          `Vuex grpc List Action not found in model ${this.model.name}`
        );
      }

      try {
        return getFromStoreOrFetchWhere({
          query: this,
          callbackFn,
          action: listAction,
          fetchParams,
        });
      } catch (error) {
        console.error(
          error,
          `Failed to resolve ${this.baseModel.name}.getFromStoreOrFetchWhere`
        );
      }
    };

    /**
     * Get Model Instance related items or dispatch a store action if none found
     * example:
     * const locations = await building.getFromStoreOrFetchRelated("locations", building.locationsList);
     */
    components.Model.prototype.getFromStoreOrFetchRelated = async function (
      relationField: string,
      uuidList: string[],
      fetchParams: any
    ): Promise<Collection<Model> | void> {
      const field = this.$fields()[relationField];

      if (!field) {
        throw new Error(`Field ${relationField} does not exist`);
      }

      if (!(field instanceof Relation)) {
        throw new Error(
          `${relationField} is not a Relation field on model ${field.model.name}`
        );
      }

      const { related }: any = field;

      if (!related.listAction) {
        throw new Error(
          `Vuex grpc List Action not found in model ${related.name}`
        );
      }

      try {
        return await getFromStoreOrFetchMany({
          query: related.query(),
          uuidList,
          action: related.listAction,
          fetchParams,
        });
      } catch (error) {
        console.error(
          error,
          `Failed to resolve ${related.name}[${this.$id}].${relationField}: ${uuidList}`
        );
        throw error;
      }
    };

    /**
     * Get Model Instance parent item or dispatch a store action if none found
     * example:
     * const site = await building.getFromStoreOrFetchBelongsTo("siteData");
     */
    components.Model.prototype.getFromStoreOrFetchBelongsTo = async function (
      belongsToField: string
    ): Promise<Item<Model>> {
      const field = this.$fields()[belongsToField];

      if (!field) {
        throw new Error(`Field ${belongsToField} does not exist`);
      }

      if (!(field instanceof BelongsTo)) {
        throw new Error(
          `${belongsToField} is not a Belongs To field on model ${field.model.name}`
        );
      }

      const { parent }: any = field;
      if (!parent.retrieveAction) {
        throw new Error(
          `Vuex grpc Retrieve Action not found in model ${parent.name}`
        );
      }

      const uuid = this[field.foreignKey];

      if (!uuid) {
        return null;
      }

      try {
        return await getFromStoreOrFetchOne({
          query: parent.query(),
          uuid,
          action: parent.retrieveAction,
        });
      } catch (error) {
        console.error(
          error,
          `Failed to resolve ${parent.name}[${this.$id}].${belongsToField}: ${uuid}`
        );
        throw error;
      }
    };
    /**
     * Resolves all relations :
     * const siteWithAll = await site.withAll();
     */
    components.Model.prototype.withAll = function () {
      let id = this.$id;
      if (Array.isArray(this.$primaryKey())) id = JSON.parse(id || "");
      return this.$query()
        .withAll()
        .find(id || "");
    };
    /**
     * Resolves all relations recursively :
     * const siteWithAll = await site.withAllRecursive();
     */
    components.Model.prototype.withAllRecursive = function (depth = 1) {
      let id = this.$id;
      if (Array.isArray(this.$primaryKey())) id = JSON.parse(id || "");
      return this.$query()
        .withAllRecursive(depth)
        .find(id || "");
    };
    /**
     * Resolves one relation :
     * const siteWithBuilding = await site.with("buildingData");
     */
    components.Model.prototype.with = function (withField: string) {
      let id = this.$id;
      if (Array.isArray(this.$primaryKey())) id = JSON.parse(id || "");
      return this.$query()
        .with(withField)
        .find(id || "");
    };
  },
};
