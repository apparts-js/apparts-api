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

export const mapEndpointMethod = (epMethod: string) =>
  ({
    get: "get",
    put: "put",
    post: "post",
    patch: "patch",
    delete: "del",
  }[epMethod]);

export const createPath = (path: string, paramsType: { [k: string]: Type }) => {
  let pathWOVersion = path.split("/").slice(3).join("/");
  const version = path.split("/")[2];
  const parts = pathWOVersion.replace(/\/:[^/]+/g, "").split("/");

  const params: string[] = [];
  let counter = 1;
  for (const param in paramsType) {
    pathWOVersion = pathWOVersion.replace(":" + param, "$" + counter++);
    params.push(param);
  }

  return {
    path: pathWOVersion,
    params,
    version,
    parts,
  };
};
