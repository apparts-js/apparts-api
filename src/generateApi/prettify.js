import * as prettier from "prettier";
export const prettify = (src) =>
  prettier.format(src.replaceAll("\n", " "), { parser: "typescript" });
