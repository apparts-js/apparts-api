import { Return, PreparedReturnError, ReturnSuccess } from "./types";
import { genType } from "./genTypes";
import { nameFromString } from "./utils";

export const getErrorReturns = (returns: Return[]) => {
  return returns
    .map((ret) => {
      if ("keys" in ret && "error" in ret.keys && "value" in ret.keys.error) {
        const { error, ...restType } = ret.keys;
        return {
          status: ret.status,
          error: error.value,
          restType: restType,
        };
      } else {
        return ret;
      }
    })
    .filter((ret): ret is PreparedReturnError => "error" in ret);
};

export const getSuccessReturns = (returns: Return[]) => {
  return returns.filter(
    (ret): ret is ReturnSuccess =>
      !("error" in ret) &&
      !("keys" in ret && "error" in ret.keys && "value" in ret.keys.error)
  );
};

export const prepareErrors = (returns: PreparedReturnError[]) => {
  const codes: Record<number, PreparedReturnError[]> = {};
  for (const r of returns) {
    codes[r.status] = codes[r.status] || [];
    codes[r.status].push(r);
  }
  for (const code in codes) {
    // filter out duplicate results
    const uniqueCodes: PreparedReturnError[] = [];

    for (const error of codes[code]) {
      if (
        uniqueCodes.filter(
          (r) => r.error === error.error && r.status === error.status
        ).length === 0
      ) {
        uniqueCodes.push(error);
      }
    }
    codes[code] = uniqueCodes;
  }
  return codes;
};

export const genErrorReturnTypes = (
  method: string,
  name: string,
  codes: Record<number, PreparedReturnError[]>
) => {
  const typeCodes: string[] = [];
  for (const code in codes) {
    const codeReturns = codes[code];
    // add catch all for code
    typeCodes.push(
      genType(`${method}${name}${code}Response`, {
        alternatives: codeReturns.map(({ error }) => ({
          type: "object",
          keys: { error: { value: error } },
        })),
        type: "oneOf",
      })
    );

    for (const r of codeReturns) {
      // add specific returns
      const errorName = nameFromString(r.error);
      typeCodes.push(
        genType(`${method}${name}${code}${errorName}Response`, {
          type: "object",
          keys: { error: { value: r.error }, ...r.restType },
        })
      );
    }
  }
  return typeCodes;
};
