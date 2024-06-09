import pluginVue from 'eslint-plugin-vue'
import pluginVitest from 'eslint-plugin-vitest'

export default [
	// add more generic rulesets here, such as:
	// js.configs.recommended,
	...pluginVue.configs['flat/recommended'],
	// ...pluginVue.configs['flat/vue2-recommended'], // Use this if you are using Vue.js 2.x.
	{
		rules: {
			// "semi": "off",
			"sort-imports": "off",
			"vue/no-restricted-block": "off",
			// To understand how to handle the cases better
			"import/named": "off",
			"@typescript-eslint/no-empty-function": "off",
			"import/export": "off",

			// Shouldn't be off, but for the moment I want to just to align
			// the eslint config, fix this ASAP
			"vue/valid-define-props": "off",

			"vue/no-export-in-script-setup": "off",
			"vue/multi-word-component-names": "off",
			"indent": ["error", "tab", {"SwitchCase": 1}],
			"vue/html-indent": [
				"error",
				"tab",
				{
					"attribute": 1,
					"baseIndent": 1,
					"closeBracket": 0,
					"alignAttributesVertically": true,
					"ignores": []
				}
			],
			"vue/require-default-prop": "off",
			"vue/no-mutating-props": ["error", {
				"shallowOnly": true
			}],
			// Remove jest in @thorn/eslint-config-base
			"jest/no-deprecated-functions": "off"
		}
	},
	{
		ignores: ["src/AuthProvider.vue", "dist/*", "vite.config.ts", "node_modules"]
	}
]
