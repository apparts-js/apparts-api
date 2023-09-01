import {
  Return,
  PreparedReturnError,
  ReturnError,
  ReturnSuccess,
} from "./types";
import { genType } from "./genTypes";
import { nameFromString } from "./utils";

export const getErrorReturns = (returns: Return[]) => {
  return returns
    .filter((ret): ret is ReturnError => ret.status >= 400)
    .map((ret) => {
      if ("keys" in ret && "error" in ret.keys && "value" in ret.keys.error) {
        const { error } = ret.keys;
        return {
          status: ret.status,
          error: error.value,
          returnType: { type: "object", keys: ret.keys },
        } as PreparedReturnError;
      } else if ("error" in ret) {
        const { status, error, ...rest } = ret;
        return {
          status: status,
          error,
          returnType: {
            type: "object",
            keys: {
              error: { value: error },
              ...rest,
            },
          },
        } as PreparedReturnError;
      } else {
        const { status, ...rest } = ret;
        return {
          status: status,
          returnType: rest,
        } as PreparedReturnError;
      }
    });
};

export const getSuccessReturns = (returns: Return[]) => {
  return returns.filter((ret): ret is ReturnSuccess => ret.status < 400);
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
        alternatives: codeReturns.map(({ returnType }) => returnType),
        type: "oneOf",
      })
    );

    for (const r of codeReturns) {
      if (!r.error) {
        continue;
      }

      // add specific returns
      const errorName = nameFromString(r.error);
      typeCodes.push(
        genType(`${method}${name}${code}${errorName}Response`, r.returnType)
      );
    }
  }
  return typeCodes;
};
