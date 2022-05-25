module.exports = {
    "env": {
        "node": true
    },

    "extends": [
        "eslint:recommended",
        "plugin:prettier/recommended",
        "plugin:@typescript-eslint/recommended"
    ],

    "plugins": [],
 
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        
    },

    "rules": {
        "arrow-body-style": "off", 
        "prefer-arrow-callback": "off",
        "no-console": process.env.NODE_ENV === 'production' ? 'warn' : 'off',
		"no-debugger": process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    }

}