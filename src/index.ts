import { Database } from "@vuex-orm/core";
import { Components } from "./interfaces/Components";
import { fetchMap } from "./functions";
import VuexORMGetOrFetch from "./VuexORMGetOrFetch";

export default {
  install(components: Components, { database }: { database: Database }) {
    new VuexORMGetOrFetch(components).plugin();
    database.entities.forEach((model: any) => {
      fetchMap[model.name] = {};
    });
  },
};
