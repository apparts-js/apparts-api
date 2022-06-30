import * as prettier from "prettier";
export const prettify = (src) =>
  prettier.format(src.replace(/\n/g, " "), { parser: "typescript" });
