import { Model } from "@vuex-orm/core";

export interface UUIDModel extends Model {
  uuid: string;
}
