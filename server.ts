import express = require("express");
import expressSession = require("express-session");
import { createServer } from "http";
import { RemoteMessageType, REQUIRE_FUNC_NAME } from "neweb-core";
import { ModulePacker } from "neweb-pack";
import { Application, SeancesManager, Server } from "neweb-server";
import { join, resolve } from "path";
import SocketIO = require("socket.io");
import ModuleServer from "./lib/ModulesServer";
import SocketIOClient from "./lib/SocketIOClient";

export default async function boostrap() {
    const appPath = resolve(join(process.cwd(), "app"));
    const port = process.env.PORT || 5000;
    const env = process.env.NODE_ENV === "production" ? "production" : "development";

    const expressApp = express();
    // static
    expressApp.use(express.static(resolve(join(appPath, "public"))));
    expressApp.get("/bundle.js", (_, res) => res.sendFile(resolve(join(__dirname, "dist", "bundle.js"))));

    const modulesPath = join(appPath, "..", "modules");
    const modulePacker = new ModulePacker({
        appRoot: appPath,
        excludedModules: ["react", "react-dom", "neweb"],
        modulesPath,
        REQUIRE_FUNC_NAME,
    });
    const app = new Application({
        appDir: appPath,
        env,
        modulePacker,
    });
    await app.init();

    const seancesManager = new SeancesManager({
        app,
    });
    // neweb
    const server = new Server({
        app,
        seancesManager,
    });
    const modulesServer = new ModuleServer({
        modulesPath,
    });
    expressApp.get("/modules/:type/:name/:version.js", modulesServer.handle);
    const session = expressSession({
        secret: "12345",
        saveUninitialized: true,
        resave: true,
    });
    expressApp.use(session, async (req, res, next) => {
        // try {
        const response = await server.resolveRequest({
            url: req.url,
            sessionId: (req.session as Express.Session).id,
            headers: req.headers as any,
        });
        if (response.type === "NotFound") {
            next();
            return;
        }
        if (response.type === "Redirect") {
            res.status(301).send(response.body);
            return;
        }
        res.send(response.body);
        /*} catch (e) {
            res.status(500).send(env === "development" ?
                (e.toString() + "\n" + e.stack).replace(/\n/gi, "<br />") : "Unknown error");
        }*/
    });

    const httpServer = createServer(expressApp);
    httpServer.listen(port, (err: any) => {
        if (err) {
            console.log.call(console, "Error server starting", err);
            process.exit(1);
            return;
        }
        console.log.call(console, "Http server at port ", port);
    });
    const io = SocketIO();
    io.attach(httpServer);
    io.on("connection", (socket) => {
        socket.on(RemoteMessageType.Initialize, async ({ seanceId }: { seanceId: string }) => {
            const socketClient = new SocketIOClient({
                socket,
                seanceId,
            });
            server.connectClient({
                seanceId,
                client: socketClient,
                request: await socketClient.getRequest(),
            });
        });
    });
}
