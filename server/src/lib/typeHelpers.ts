export type KeyTypePairs<T> = {
  [K in keyof T]: {
    key: K;
    type: T[K];
  }
}[keyof T];

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Combinations<T, Keys extends keyof T = keyof T> =
  [Keys] extends [never]
    ? {}
    : Keys extends any
      ? {
          [K in Keys]: T[K];
        } & Combinations<T, Exclude<keyof T, Keys>>
      : never;