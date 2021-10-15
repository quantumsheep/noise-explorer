import { page } from "$app/stores";
import type { Unsubscriber } from "svelte/store";

function queryToObject(params: URLSearchParams) {
  const obj: Record<string, string | string[]> = {};

  for (const key of params.keys()) {
    if (params.getAll(key).length > 1) {
      obj[key] = params.getAll(key);
    } else {
      obj[key] = params.get(key);
    }
  }

  return obj;
}

let query: Record<string, string | string[]> = {};

let hasSubscribed = false;

function subscribe() {
  page.subscribe((p) => {
    query = queryToObject(p.query);
  });
}

export function createQueryStore<T extends string = string>(prop: string): {
  subscribe: (cb: (v: T | T[]) => unknown) => Unsubscriber;
  set: (v: T) => void;
  getAll: () => T[];
  get: () => T;
} {
  if (!hasSubscribed) {
    subscribe();
    hasSubscribed = true;
  }

  return {
    subscribe: (cb: (v: T | T[]) => unknown) => {
      return page.subscribe((p) => {
        cb(p.query[prop]);
      })
    },
    set: (v: T) => {
      query[prop] = v;
      const urlSearchParams = new URLSearchParams(<any>query);
      const g = `?${urlSearchParams.toString()}`;
      window.history.pushState(null, "", g);
    },
    getAll: () => {
      const value = query[prop];

      if (Array.isArray(value)) {
        return <T[]>value;
      }

      return <T[]>[value];
    },
    get: () => {
      const value = query[prop];

      if (Array.isArray(value)) {
        return <T>value[0];
      }

      return <T>value;
    },
  };
}
