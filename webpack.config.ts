export = (env: string) => ({
    entry: __dirname + "/client.js",
    output: {
        path: __dirname + "/dist",
        filename: "bundle." + (env === "production" ? "production" : "development") + ".js",
    },
});
