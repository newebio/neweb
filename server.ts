import debug = require("debug");
import express = require("express");
import expressSession = require("express-session");
import { createServer } from "http";
import { RemoteMessageType, REQUIRE_FUNC_NAME } from "neweb-core";
import { ModulePacker } from "neweb-pack";
import { Application, SeancesManager, Server } from "neweb-server";
import { join, resolve } from "path";
import SessionFileStore = require("session-file-store");
import SocketIO = require("socket.io");
import ModuleServer from "./lib/ModulesServer";
import SessionsManager from "./lib/SessionsManager";
import SocketIOClient from "./lib/SocketIOClient";

export default async function boostrap() {

    // settings
    const appPath = resolve(join(process.cwd(), "app"));
    const port = process.env.PORT || 5000;
    const env = process.env.NODE_ENV === "production" ? "production" : "development";
    const modulesPath = join(appPath, "..", "modules");
    const sessionsPath = join(appPath, "..", "sessions");
    // logs
    if (env === "development") {
        debug.enable("*");
    }
    // neweb-pack
    const modulePacker = new ModulePacker({
        appRoot: appPath,
        excludedModules: ["react", "react-dom", "neweb"],
        modulesPath,
        REQUIRE_FUNC_NAME,
    });
    // create app
    const app = new Application({
        appDir: appPath,
        env,
        modulePacker,
    });
    await app.init();

    const appConfig = await app.getConfig();

    const sessionsFileStore = SessionFileStore(expressSession);
    const sessionsStorage = new sessionsFileStore({
        path: sessionsPath,
        retries: 1,
        ttl: appConfig.session.ttl || 86400 * 100000,
    });
    const session = expressSession({
        secret: appConfig.session.secret,
        saveUninitialized: true,
        resave: true,
        store: sessionsStorage,
    });

    const expressApp = express();
    // static
    expressApp.use(express.static(resolve(join(appPath, "public"))));
    expressApp.get("/bundle." + env + ".js", (_, res) =>
        res.sendFile(resolve(join(__dirname, "dist", "bundle." + env + ".js"))));

    const sessionsManager = new SessionsManager({
        sessionsPath,
        sessionsStorage,
    });
    const seancesManager = new SeancesManager({
        app,
        sessionsManager,
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

    expressApp.use(session, async (req, res, next) => {
        // try {
        const response = await server.resolveRequest({
            url: req.url,
            sessionId: (req.session as Express.Session).id,
            headers: req.headers as any,
        });
        Object.keys(response.headers).map((key) => {
            res.header(key, response.headers[key]);
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
    // Setup SocketIO
    const io = SocketIO();
    io.use((socket, next) => {
        session(socket.request, socket.request.res, next);
    });
    io.on("connection", (socket) => {
        socket.on(RemoteMessageType.Initialize, async ({ seanceId }: { seanceId: string }) => {
            const socketClient = new SocketIOClient({
                socket,
                seanceId,
            });
            const request = await socketClient.getRequest();
            server.connectClient({
                seanceId,
                client: socketClient,
                request,
            });
        });
    });
    io.attach(httpServer);
    // Start listening
    httpServer.listen(port, (err: any) => {
        if (err) {
            debug("http")("Error server starting", err);
            process.exit(1);
            return;
        }
        debug("http")("Http server at port ", port);
    });
}
