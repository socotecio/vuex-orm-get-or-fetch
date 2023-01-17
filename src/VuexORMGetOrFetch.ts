import { UUIDModel } from './interfaces/UuidModel';
import { Query, Model } from "@vuex-orm/core";
import { Components } from "./interfaces/Components";
import { Query as QueryMixin } from "./mixins/Query";
import { Model as ModelMixn } from "./mixins/Model";

export default class VuexORMGetOrFetch<M extends UUIDModel> {
  query: Query<M> & typeof Query;
  model: M & typeof Model;

  constructor(components: Components<M>) {
    this.query = components.Query;
    this.model = components.Model;
  }

  plugin(): void {
    QueryMixin(this.query);
    ModelMixn(this.model);
  }
}
