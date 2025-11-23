import globals from "globals";
import pluginJs from "@eslint/js";
import jest from "eslint-plugin-jest";


export default [
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  pluginJs.configs.recommended,
  {
    rules: {
      "no-unused-vars": "warn",
    },
  },
  {
    ignores: ["dist/*", "coverage/*", "**/__tests__/**", "**/*.test.js"],
  },
  {
    files: ["**/__tests__/**/*.js", "**/*.test.js"],
    ...jest.configs["flat/recommended"],
    languageOptions: {
      globals: {
        ...globals.jest, // Добавляем jest глобальные переменные
        ...globals.node, // Добавляем node глобальные переменные
      },
    },
    rules: {
      ...jest.configs["flat/recommended"].rules,
      "jest/prefer-expect-assertions": "off",
      "jest/expect-expect": "error",
      "no-undef": "off",
    },
  },
];
