import { Query as BaseQuery, Model } from "@vuex-orm/core";
import {
  getFromStoreOrFetchMany,
  getFromStoreOrFetchOne,
  getFromStoreOrFetchWhere,
} from "../functions";
import { FetchParams } from "../types/vuex-orm";

export function Query(query: BaseQuery & typeof BaseQuery): void {
  query.getFromStoreOrFetchOne = async function (
    uuid: string,
    action: string,
    findByUuid: boolean
  ) {
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
      return null;
    }
  };

  query.getFromStoreOrFetchMany = async function (
    uuidList: string[],
    fetchParams: FetchParams,
    paginated = true,
    action: string
  ) {
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
      return [];
    }
  };

  query.getFromStoreOrFetchWhere = async function (
    callbackFn: (item: Model) => boolean,
    fetchParams: FetchParams
  ) {
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
      return [];
    }
  };
}
