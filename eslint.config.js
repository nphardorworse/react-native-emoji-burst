const reactPlugin = require("eslint-plugin-react");
const reactHooksPlugin = require("eslint-plugin-react-hooks");
const tsParser = require("@typescript-eslint/parser");

module.exports = [
  {
    files: ["src/**/*.{ts,tsx}", "example/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    settings: {
      react: { version: "detect" },
    },
  },
  {
    ignores: ["lib/**", "node_modules/**", "example/node_modules/**", "example/ios/**"],
  },
];
