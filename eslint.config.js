import { defineConfig } from "eslint/config";
import js from "@eslint/js";

export default defineConfig([
	{
		files: ["**/*.js"],
		plugins: {
			js,
            ts
		},
		extends: ["js/recommended", "prettier"],
		rules: {
			"no-unused-vars": "warn",
			"no-undef": "warn",
		},
	},
]);
