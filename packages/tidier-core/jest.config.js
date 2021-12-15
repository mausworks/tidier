/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testRegex: "src/.*.spec.ts",
  collectCoverageFrom: ["src/*.ts", "!src/*.test.ts", "!**/index.ts"],
};
