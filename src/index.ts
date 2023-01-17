import { UUIDModel } from "./interfaces/UuidModel";
import { Database } from "@vuex-orm/core";
import { Components } from "./interfaces/Components";
import { fetchMap } from "./functions";
import VuexORMGetOrFetch from "./VuexORMGetOrFetch";

export default {
  install<M extends UUIDModel>(
    components: Components<M>,
    { database }: { database: Database }
  ) {
    new VuexORMGetOrFetch(components).plugin();
    database.entities.forEach((model: any) => {
      fetchMap[model.name] = {};
    });
  },
};
