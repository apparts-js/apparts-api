import {
  genErrorReturnTypes,
  getErrorReturns,
  getSuccessReturns,
  prepareErrors,
} from "./genErrorReturnTypes";
import { genType } from "./genTypes";
import { Return, PreparedReturnError, Type } from "./types";
import {
  capitalize,
  createPath,
  mapEndpointMethod,
  nameFromPath,
  nameFromString,
} from "./utils";

export const genErrorCatchers = (
  method: string,
  name: string,
  codes: Record<number, PreparedReturnError[]>
) => {
  const capMethod = capitalize(method);
  const typeCodes: string[] = [];
  for (const code in codes) {
    const codeReturns = codes[code];

    // add catch all for code
    const catchAllTypeName = `${capMethod}${name}${code}Response`;
    typeCodes.push(`
on${code}: (fn: (p: ${catchAllTypeName}) => void) => {
  request.on<${catchAllTypeName}>(${code}, (p) => { fn(p); });
  return enrichedRequest;
},`);

    for (const r of codeReturns) {
      if (!r.error) {
        continue;
      }
      const errorName = nameFromString(r.error);

      // add specific returns
      const catchErrorTypeName = `${capMethod}${name}${code}${errorName}Response`;
      typeCodes.push(`
on${code}${errorName}: (fn: (p: ${catchErrorTypeName}) => void) => {
  request.on<${catchErrorTypeName}>(
{ status: ${code}, error: ${JSON.stringify(r.error)} },
 (p) => { fn(p); });
  return enrichedRequest;
},`);
    }
  }
  return typeCodes;
};

export const genEndpoint = ({
  method,
  path,
  assertions,
  returns,
  emitNoSchema,
}: /*  title,
  description,
  options,*/
{
  method: string;
  path: string;
  assertions: {
    query?: { [k: string]: Type };
    body?: { [k: string]: Type };
    params?: { [k: string]: Type };
  };
  returns: Return[];
  title?: string;
  description?: string;
  options?: unknown;
  emitNoSchema: boolean;
}) => {
  const {
    query: assertionsQuery = {},
    body: assertionsBody = {},
    params: assertionsParams = {},
  } = assertions;

  const name = nameFromPath(path),
    hasQuery = Object.keys(assertionsQuery).length > 0,
    hasBody = Object.keys(assertionsBody).length > 0,
    hasParams = Object.keys(assertionsParams).length > 0,
    capMethod = capitalize(method);

  const funcParams: string[] = [];
  const funcParamTypes: string[] = [];
  const funcCalls: string[] = [];

  const errorReturnTypes = prepareErrors(getErrorReturns(returns));
  const endpointTypes = [
    genType(
      `${method}${name}Returns`,
      {
        alternatives: getSuccessReturns(returns),
        type: "oneOf",
      },
      { emitNoSchema }
    ),
    ...genErrorReturnTypes(method, name, errorReturnTypes, { emitNoSchema }),
  ];
  const errorCatchers = genErrorCatchers(method, name, errorReturnTypes).join(
    "\n"
  );
  if (hasParams) {
    endpointTypes.push(
      genType(
        `${method}${name}Params`,
        {
          keys: assertionsParams,
          type: "object",
        },
        { emitNoSchema }
      )
    );
    funcParams.push(`params`);
    funcParamTypes.push(`params: ${capMethod}${name}Params`);
  }
  if (hasBody) {
    endpointTypes.push(
      genType(
        `${method}${name}Body`,
        {
          keys: assertionsBody,
          type: "object",
        },
        { emitNoSchema }
      )
    );

    funcCalls.push(`.data(data)`);
    funcParams.push(`data`);
    funcParamTypes.push(`data: ${capMethod}${name}Body`);
  }
  if (hasQuery) {
    endpointTypes.push(
      genType(
        `${method}${name}Query`,
        {
          keys: assertionsQuery,
          type: "object",
        },
        { emitNoSchema }
      )
    );
    funcCalls.push(`.query(query)`);
    funcParams.push(`query`);
    funcParamTypes.push(`query: ${capMethod}${name}Query`);
  }

  const {
    path: pathWOVersion,
    params,
    parts,
    version,
  } = createPath(path, assertionsParams);
  funcCalls.push(`.v(${version})`);
  const methodifiedParts = ["v" + version, ...parts, method];
  const paramStr =
    funcParams.length > 0
      ? `{ ${funcParams.join(",")} }: { ${funcParamTypes.join(";")} }`
      : "";
  const endpointFunc = `
(${paramStr})  => {

  const request = api.${mapEndpointMethod(method)}<${capMethod}${name}Returns>(
    ${JSON.stringify(pathWOVersion)}
, [${params.map((p) => "params." + p).join(",")}])
  ${funcCalls.join("\n")};

  const enrichedRequest = Object.assign(request, {
    ${errorCatchers}
  });
  return enrichedRequest;
}`;
  return {
    funcCode: endpointFunc,
    typeCode: endpointTypes.join("\n\n"),
    path: methodifiedParts,
  };
};
