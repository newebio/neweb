import { readFileSync } from "fs";
import ServerBootstrap from "./lib/ServerBootstrap";
export default async function boostrap() {
    require.extensions[".html"] = (module, filename) => {
        module.exports = readFileSync(filename).toString();
    };
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
    const env = process.env.NODE_ENV === "production" ? "production" : "development";
    const server = new ServerBootstrap({
        port,
        rootPath: process.cwd(),
        env,
    });
    return server.start();
}
