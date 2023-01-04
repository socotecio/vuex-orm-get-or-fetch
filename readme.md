# Vuex ORM GET-OR-FETCH [![CircleCI](https://circleci.com/gh/socotecio/vuex-orm-get-or-fetch.svg?style=svg&circle-token=b604be3648ae5aef21993850e0ffef5be54d4e74)](https://app.circleci.com/pipelines/github/socotecio/vuex-orm-get-or-fetch)

Allow to get data from the registered model in the vuex-orm store entities or to fetch it by an api call

## QuickStart

### Installation

	npm install @vuex-orm/core vuex-orm-get-or-fetch --save 

### Setting up

```js
import Vue from "vue";
import Vuex from "vuex";
import VuexORM from "@vuex-orm/core";
import VuexOrmGetOrFetch from "vuex-orm-get-or-fetch";

Vue.use(Vuex);

const database = new VuexORM.Database();
database.register(YourModel);

VuexORM.use(VuexOrmGetOrFetch, { database });
```
