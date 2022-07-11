import { Type } from "@apparts/types";
import { capitalize } from "./utils";

export const createTypeFsOpts = (type: Type) => {
  let code = "";
  if (type.optional) {
    code += ".optional()";
  }
  if (type.description) {
    code += `.description(${JSON.stringify(type.description)})`;
  }
  if (type.default) {
    code += `.optional()`;
  }
  /*  if (type.title) {
    code += `.title(${JSON.stringify(type.title)})`;
  }*/
  if (type.public) {
    code += `.public()`;
  }
  if (type.auto) {
    code += `.auto()`;
  }
  if (type.key) {
    code += `.key()`;
  }
  if (type.derived) {
    code += `.derived(undefined)`;
  }
  if (type.mapped) {
    code += `.mapped(${JSON.stringify(type.mapped)})`;
  }
  if (type.readOnly) {
    code += `.readOnly()`;
  }
  return code;
};

export const createTypeFsFromType = (type: Type) => {
  const opts = createTypeFsOpts(type);

  if ("value" in type) {
    return `schema.value(${JSON.stringify(type.value)})${opts}`;
  }

  switch (type.type) {
    case "object":
      if ("keys" in type) {
        const keys = Object.keys(type.keys);
        return `schema.obj({
${keys
  .map((key) => `"${key}": ${createTypeFsFromType(type.keys[key])}`)
  .join(",")}
})${opts}`;
      } else {
        return `schema.objValues(${createTypeFsFromType(type.values)})${opts}`;
      }
    case "array":
      return `schema.array(${createTypeFsFromType(type.items)})${opts}`;
    case "oneOf":
      return `schema.oneOf([
${type.alternatives.map((alt) => createTypeFsFromType(alt)).join(",")}
])${opts}`;
    case "int":
      return `schema.int()${opts}`;
    case "float":
      return `schema.float()${opts}`;
    case "bool":
    case "boolean":
      return `schema.boolean()${opts}`;
    case "string":
      return `schema.string()${opts}`;
    case "hex":
      return `schema.hex()${opts}`;
    case "uuidv4":
      return `schema.uuidv4()${opts}`;
    case "base64":
      return `schema.base64()${opts}`;
    case "email":
      return `schema.email()${opts}`;
    case "null":
      return `schema.nill()${opts}`;
    case "/":
      return `schema.any()${opts}`;
    case "id":
      return `schema.int().semantic("id")${opts}`;
    /* case "id":
         return `schema.string().semantic("id")${opts}`;*/
    case "password":
      return `schema.string().semantic("password")${opts}`;
    case "time":
      return `schema.int().semantic("time")${opts}`;
    default:
      throw new Error("Not supported type " + JSON.stringify(type, null, 2));
  }
};

export const genType = (name: string, type: Type) => `
export const ${name}Schema = ${createTypeFsFromType(type)};
export type ${capitalize(name)} = schema.InferType<
  typeof ${name}Schema
>;
`;
