module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
        'plugin:@typescript-eslint/recommended',
        'prettier/@typescript-eslint',
        'plugin:prettier/recommended'
    ],
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module'
    },
    rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-member-accessibility": "off",
        "@typescript-eslint/no-use-before-define": "off",
        "@typescript-eslint/ban-ts-ignore": "off",
        "@typescript-eslint/no-empty-function": "off"
    }
};