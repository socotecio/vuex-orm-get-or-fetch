import { UUIDModel } from "./UuidModel";
import { Model, Query } from "@vuex-orm/core";

export interface Components<M extends UUIDModel> {
  Model: M & typeof Model;
  Query: Query<M> & typeof Query;
}
