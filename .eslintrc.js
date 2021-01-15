
module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true
    },
    "extends": [
        "prettier",
        "prettier/@typescript-eslint"
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "createDefaultProgram": true,
        "project": "tsconfig.es6.json",
        "sourceType": "module"
    },
    "plugins": [
        "eslint-plugin-jsdoc",
        "eslint-plugin-import",
        "eslint-plugin-prefer-arrow",
        "@typescript-eslint",
        "@typescript-eslint/tslint"
    ],
    "rules": {
        "@typescript-eslint/array-type": [
            "error",
            {
                "default": "array-simple"
            }
        ],
        "@typescript-eslint/ban-types": [
            "error",
            {
                "types": {
                    "Object": {
                        "message": "Use {} instead."
                    },
                    "String": {
                        "message": "Use 'string' instead."
                    },
                    "Number": {
                        "message": "Use 'number' instead."
                    },
                    "Boolean": {
                        "message": "Use 'boolean' instead."
                    }
                }
            }
        ],
        "@typescript-eslint/consistent-type-assertions": "error",
        "@typescript-eslint/member-delimiter-style": [
            "error",
            {
                "multiline": {
                    "delimiter": "semi",
                    "requireLast": true
                },
                "singleline": {
                    "delimiter": "semi",
                    "requireLast": false
                }
            }
        ],
        "@typescript-eslint/naming-convention": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/no-namespace": "error",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-require-imports": "off",
        "@typescript-eslint/no-unused-expressions": "error",
        "@typescript-eslint/no-unused-vars": "warn",
        "@typescript-eslint/restrict-plus-operands": "off",
        "@typescript-eslint/semi": [
            "error",
            "always"
        ],
        "@typescript-eslint/triple-slash-reference": "error",
        "@typescript-eslint/tslint/config": [
            "error",
            {
                "rules": {
                    "ban": true
                }
            }
        ],
        "arrow-body-style": "error",
        "curly": "error",
        "default-case": "error",
        "eqeqeq": [
            "error",
            "smart"
        ],
        "guard-for-in": "off",
        "id-blacklist": "off",
        "id-match": "off",
        "import/no-default-export": "error",
        "jsdoc/check-alignment": "error",
        "jsdoc/check-indentation": "off",
        "jsdoc/newline-after-description": "error",
        "max-len": [
            "error",
            {
                "ignorePattern": "^import |^export ",
                "code": 200
            }
        ],
        "new-parens": "error",
        "no-debugger": "error",
        "no-multiple-empty-lines": "error",
        "no-new-wrappers": "error",
        "no-throw-literal": "error",
        "no-underscore-dangle": "off",
        "no-unused-labels": "error",
        "no-var": "warn",
        "object-shorthand": "error",
        "prefer-arrow/prefer-arrow-functions": "error",
        "prefer-const": "warn",
        "radix": "off",
        "use-isnan": "error"
    }
};
