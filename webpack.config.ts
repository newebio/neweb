export = (env: string) => ({
    entry: __dirname + "/client.neweb.js",
    output: {
        path: __dirname + "/dist",
        filename: "bundle." + (env === "production" ? "production" : "development") + ".neweb.js",
    },
});
