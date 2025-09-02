import { genEndpoint } from "./genEndpoint";
import { EndpointDefinition } from "./types";
import { assocPath } from "ramda";

type Options = {
  includePaths?: string[][];
  excludePaths?: string[][];
  emitNoSchema?: boolean;
};

export const pathMatches = (paths: string[][], path: string[]) => {
  for (const p of paths) {
    if (p.reduce((a, b, i) => a && b === path[i], true)) {
      return true;
    }
  }
  return false;
};

export const excludeEndpoints = <T extends { path: string[] }>(
  endpoints: T[],
  options?: Options
) =>
  endpoints.filter(
    ({ path }) =>
      !options ||
      (options.includePaths
        ? pathMatches(options.includePaths, path)
        : options?.excludePaths
        ? !pathMatches(options.excludePaths, path)
        : true)
  );

export const genFile = (api: EndpointDefinition[], options?: Options) => {
  const endpoints = excludeEndpoints(
    api
      .filter(({ method }) => method !== "options")
      .map((endpoint) =>
        genEndpoint(
          {
            ...endpoint,
            assertions: endpoint.assertions || {},
            returns: endpoint.returns || [],
          },
          { emitNoSchema: Boolean(options?.emitNoSchema) }
        )
      ),
    options
  );

  const types = endpoints.map(({ typeCode }) => typeCode).join("\n");
  let fnHirarchy = {};
  let counter = 0;
  for (const endpoint of endpoints) {
    fnHirarchy = assocPath(endpoint.path, `$${String(counter++)}`, fnHirarchy);
  }
  let fnCode = JSON.stringify(fnHirarchy);
  counter = 0;
  for (const endpoint of endpoints) {
    fnCode = fnCode.replace(`"$${String(counter++)}"`, endpoint.funcCode);
  }

  return `
${options?.emitNoSchema ? "" : `import * as schema from "@apparts/types";`}
import { ApiType } from "@apparts/api";

${types}

export const createApi = (api: ApiType) => {
  return ${fnCode};
};
`;
};
