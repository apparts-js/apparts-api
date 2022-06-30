import { genEndpoint } from "./genEndpoint";
import { EndpointDefinition } from "./types";
import { assocPath } from "ramda";

export const genFile = (api: EndpointDefinition[]) => {
  const endpoints = api
    .filter(({ method }) => method !== "options")
    .map((endpoint) =>
      genEndpoint({
        ...endpoint,
        assertions: endpoint.assertions || {},
        returns: endpoint.returns || [],
      })
    );

  const types = endpoints.map(({ typeCode }) => typeCode).join("\n");
  let fnHirarchy = {};
  let counter = 0;
  for (const endpoint of endpoints) {
    fnHirarchy = assocPath(endpoint.path, `$${counter++}`, fnHirarchy);
  }
  let fnCode = JSON.stringify(fnHirarchy);
  counter = 0;
  for (const endpoint of endpoints) {
    fnCode = fnCode.replace(`"$${counter++}"`, endpoint.funcCode);
  }

  return `
import * as schema from "@apparts/types";
import { ApiType } from "@apparts/api";

${types}

export const createApi = (api: ApiType) => {
  return ${fnCode};
};
`;
};
