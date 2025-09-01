import { Type } from "@apparts/types";

export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);
export const capitalizeSentence = (str: string) =>
  str.replace(/( |^)[a-z]/gi, (m) => m.toUpperCase());

export const nameFromString = (str: string) =>
  capitalizeSentence(str.replace(/[^a-z0-9]/gi, " ")).replace(
    /[^a-z0-9]/gi,
    ""
  );
export const nameFromPath = nameFromString;

export const mapEndpointMethod = (epMethod: string): string =>
  ({
    get: "get",
    put: "put",
    post: "post",
    patch: "patch",
    delete: "del",
  }[epMethod] ?? "");

export const createPath = (path: string, paramsType: { [k: string]: Type }) => {
  let pathWOVersion = path.split("/").slice(3).join("/");
  const version = path.split("/")[2];
  const parts = pathWOVersion.replace(/\/:[^/]+/g, "").split("/");
  const partsWithParams = pathWOVersion.split("/").filter((p) => p !== "");

  const params: string[] = [];
  let counter = 1;
  for (const param in paramsType) {
    pathWOVersion = pathWOVersion.replace(":" + param, "$" + String(counter++));
    params.push(param);
  }

  const lastPart = partsWithParams[partsWithParams.length - 1];
  if (lastPart.charAt(0) === ":") {
    parts.push("by" + capitalize(lastPart.slice(1)));
  }

  return {
    path: pathWOVersion,
    params,
    version,
    parts,
  };
};
