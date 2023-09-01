const rules = {
  "no-var": "error",
  "prefer-const": "error",
  "no-unneeded-ternary": "error",
  "prefer-arrow-callback": "error",
  "no-lonely-if": "error",
  "consistent-return": "error",
  eqeqeq: "error",
  curly: "error",
  indent: "off",
  "@typescript-eslint/indent": "off",
  "@typescript-eslint/no-explicit-any": "off",
};

module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: "eslint:recommended",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  rules,
  overrides: [
    {
      plugins: ["jest"],
      files: [
        "*.test.js",
        "*-test.js",
        "**/mock*.js",
        "**/__mocks__/**",
        "**/tests/**",
        "**/fakeData/**",
      ],
      extends: ["plugin:jest/recommended"],
      env: {
        jest: true,
        node: true,
      },
    },
    {
      files: ["*.ts"],
      plugins: ["@typescript-eslint"],
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier",
      ],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: "tsconfig.json",
        sourceType: "module",
      },
      rules: {
        "@typescript-eslint/ban-ts-comment": "off",
      },
    },
  ],
};
