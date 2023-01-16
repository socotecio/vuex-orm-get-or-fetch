import { BelongsTo, Model as BaseModel, Relation } from "@vuex-orm/core";
import { getFromStoreOrFetchMany, getFromStoreOrFetchOne } from "../functions";
import { FetchParams } from "../types/vuex-orm";

export function Model(model: BaseModel & typeof BaseModel): void {
  model.getFromStoreOrFetchBelongsTo = async function (belongsToField: string) {
    const field = this.$fields()[belongsToField];
    if (!field) throw new Error(`Field ${belongsToField} does not exist`);
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
      return null;
    }
  };

  model.getFromStoreOrFetchRelated = async function (
    relationField: string,
    uuidList: string[],
    fetchParams: FetchParams
  ) {
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
      return [];
    }
  };

  model.withAll = function () {
    let id = this.$id;
    if (Array.isArray(this.$primaryKey())) id = JSON.parse(id || "");
    return this.$query()
      .withAll()
      .find(id || "");
  };

  model.withAllRecursive = function (depth = 1) {
    let id = this.$id;
    if (Array.isArray(this.$primaryKey())) id = JSON.parse(id || "");
    return this.$query()
      .withAllRecursive(depth)
      .find(id || "");
  };

  model.withField = function (withField: string) {
    let id = this.$id;
    if (Array.isArray(this.$primaryKey())) id = JSON.parse(id || "");
    return this.$query()
      .with(withField)
      .find(id || "");
  };
}
