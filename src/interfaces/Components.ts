import { Model, Query } from "@vuex-orm/core";

export interface Components {
  Model: Model & typeof Model;
  Query: Query & typeof Query;
}
