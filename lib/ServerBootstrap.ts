import debug = require("debug");
import express = require("express");
import expressSession = require("express-session");
import { createServer } from "http";
import { RemoteMessageType, REQUIRE_FUNC_NAME } from "neweb-core";
import { ModulePacker } from "neweb-pack";
import { ServerPageRenderer } from "neweb-react/server";
import { Application, SeancesManager, Server } from "neweb-server";
import { join, resolve } from "path";
import SessionFileStore = require("session-file-store");
import SocketIO = require("socket.io");
import ExpressHttpHandler from "./ExpressHttpHandler";
import ModuleServer from "./ModulesServer";
import NewebServerPageRenderer from "./neweb-components/server/PageRenderer";
import SessionsManager from "./SessionsManager";
import SocketIOClient from "./SocketIOClient";
export interface IServerBootstrapConfig {
    rootPath: string;
    port: number;
    env: "production" | "development";
    expressApp?: express.Express;
    engine?: "react" | "neweb";
}
class ServerBootstrap {
    protected engine: "react" | "neweb" = "neweb";
    constructor(protected config: IServerBootstrapConfig) {
        this.engine = this.config.engine || "neweb";
    }
    public async start() {
        const rootPath = this.config.rootPath;
        const port = this.config.port;
        const env = this.config.env;
        // settings
        const appPath = resolve(join(rootPath, "app"));
        const modulesPath = join(appPath, "..", "modules");
        const sessionsPath = join(appPath, "..", "sessions");
        // logs
        if (env === "development") {
            debug.enable("*,-engine:*,-engine,-socket.io-parser,-socket.io:*");
        }
        const expressApp = this.config.expressApp ? this.config.expressApp : express();
        // neweb-pack
        const modulePacker = new ModulePacker({
            appRoot: appPath,
            excludedModules: ["react", "react-dom", "neweb", "neweb-components"],
            modulesPath,
            REQUIRE_FUNC_NAME,
            webpackConfig: {
                module: {
                    rules: [{
                        test: /\.html$/,
                        use: [{
                            loader: require.resolve("html-loader"),
                            options: {
                                minimize: true,
                            },
                        }],
                    }],
                },
            },
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

        // static
        expressApp.use(express.static(resolve(join(appPath, "public"))));
        expressApp.get("/bundle." + env + ".js", (_, res) =>
            res.sendFile(resolve(join(__dirname, "..", "dist", "bundle." + env + "." + this.engine + ".js"))));

        const sessionsManager = new SessionsManager({
            sessionsPath,
            sessionsStorage,
        });
        const seancesManager = new SeancesManager({
            app,
            sessionsManager,
        });
        // neweb
        const pageRenderer = this.engine === "react" ? new ServerPageRenderer({
            app,
        }) : new NewebServerPageRenderer({
            app,
        });
        const server = new Server({
            app,
            seancesManager,
            pageRenderer,
        });
        const modulesServer = new ModuleServer({
            modulesPath,
        });
        expressApp.get("/modules/:type/:name/:version.js", modulesServer.handle);

        const expressHandler = new ExpressHttpHandler({
            app: expressApp,
            server,
        });
        expressApp.use(session, expressHandler.handle);

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
}
export default ServerBootstrap;
