import js from "@eslint/js";
import globals from "globals";

export default [
    {
        files: ["**/*.js"],
        ignores: ["node_modules/**", "runs/**"],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            }
        },
        rules: {
            ...js.configs.recommended.rules
        }
    }
];
