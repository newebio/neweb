import ServerBootstrap from "./lib/ServerBootstrap";
export default async function boostrap() {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
    const env = process.env.NODE_ENV === "production" ? "production" : "development";
    const server = new ServerBootstrap({
        port,
        rootPath: process.cwd(),
        env,
    });
    return server.start();
}
