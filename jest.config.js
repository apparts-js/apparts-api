module.exports = {
  testRunner: "jest-circus/runner",
  testTimeout: 5000,
  clearMocks: true,
  coveragePathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/tests"],
  watchPathIgnorePatterns: ["/\\.#.*", "/.*~", "/#.*#"],

  testEnvironment: "node",
  transform: {
    //    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.[tj]s$": "ts-jest",
  },
  moduleNameMapper: {
    // Bug with Axios https://github.com/axios/axios/issues/6135
    "^axios$": "axios/dist/node/axios.cjs",
  },
  moduleFileExtensions: ["ts", "js", "json", "node"],
  testPathIgnorePatterns: ["build", "node_modules"],
};
