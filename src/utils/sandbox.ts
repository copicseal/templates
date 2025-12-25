export function createSandbox<T = any>(env: Record<string, any>) {
  const exports = { } as Record<string, T>;

  const envKeys = Object.keys(env);

  const ret = {
    run(code: string) {
      // eslint-disable-next-line no-new-func
      const fn = new Function(
        'exports',
        ...envKeys,
        `"use strict";\n${code}`,
      );
      fn(exports, ...envKeys.map(key => env[key]));
      return ret;
    },
    exports,
  };
  return ret;
}
