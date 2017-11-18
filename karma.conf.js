"use strict";

process.env.CHROME_BIN = require("puppeteer").executablePath();

exports = module.exports = function (config) {

    config.set({
        autoWatch: false,
        browsers: ["ChromeHeadless"],
        colors: true,
        concurrency: 1,
        files: [
            { pattern: "src/**/*.ts" }
        ],
        frameworks: ["mocha", "karma-typescript"],
        preprocessors: {
            "**/*.ts": ["karma-typescript"],
        },
        karmaTypescriptConfig: {
            include: {
                mode: "replace",
                values: ["**/*.ts"]
            },
            tsconfig: "./tsconfig.json"
        },
        reporters: ["spec"],
        port: 9876,
        singleRun: true
    });
};