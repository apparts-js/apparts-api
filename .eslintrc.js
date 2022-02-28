module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: ["eslint:recommended"],
  parser: "babel-eslint",
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
  overrides: [
    {
      files: ["*-?test.js", "*test.js"],
      env: {
        jest: true,
      },
    },
    {
      files: ["*.ts"],
      plugins: ["@typescript-eslint", "jest"],
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:jest/recommended",
        "prettier",
      ],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: "tsconfig.json",
        sourceType: "module",
      },
    },
  ],
};
