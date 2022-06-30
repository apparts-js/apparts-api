import { ReturnError } from "./types";
import { genType } from "./genTypes";
import { nameFromString } from "./utils";

export const prepareErrors = (returns: ReturnError[]) => {
  const codes: Record<number, ReturnError[]> = {};
  for (const r of returns) {
    codes[r.status] = codes[r.status] || [];
    codes[r.status].push(r);
  }
  for (const code in codes) {
    // filter out duplicate results
    const uniqueCodes: ReturnError[] = [];

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
  codes: Record<number, ReturnError[]>
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
          keys: { error: { value: r.error } },
        })
      );
    }
  }
  return typeCodes;
};
