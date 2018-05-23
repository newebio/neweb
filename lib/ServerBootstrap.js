"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require("debug");
const express = require("express");
const expressSession = require("express-session");
const http_1 = require("http");
const server_1 = require("neweb-components/server");
const neweb_core_1 = require("neweb-core");
const neweb_pack_1 = require("neweb-pack");
const server_2 = require("neweb-react/server");
const neweb_server_1 = require("neweb-server");
const path_1 = require("path");
const SessionFileStore = require("session-file-store");
const SocketIO = require("socket.io");
const ExpressHttpHandler_1 = require("./ExpressHttpHandler");
const ModulesServer_1 = require("./ModulesServer");
const SessionsManager_1 = require("./SessionsManager");
const SocketIOClient_1 = require("./SocketIOClient");
class ServerBootstrap {
    constructor(config) {
        this.config = config;
        this.engine = "neweb";
        this.engine = this.config.engine || "neweb";
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            const rootPath = this.config.rootPath;
            const port = this.config.port;
            const env = this.config.env;
            // settings
            const appPath = path_1.resolve(path_1.join(rootPath, "app"));
            const modulesPath = path_1.join(appPath, "..", "modules");
            const sessionsPath = path_1.join(appPath, "..", "sessions");
            // logs
            if (env === "development") {
                debug.enable("*,-engine:*,-engine,-socket.io-parser,-socket.io:*");
            }
            const expressApp = this.config.expressApp ? this.config.expressApp : express();
            // neweb-pack
            const modulePacker = new neweb_pack_1.ModulePacker({
                appRoot: appPath,
                excludedModules: ["react", "react-dom", "neweb", "neweb-components"],
                modulesPath,
                REQUIRE_FUNC_NAME: neweb_core_1.REQUIRE_FUNC_NAME,
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
            const app = new neweb_server_1.Application({
                appDir: appPath,
                env,
                modulePacker,
            });
            yield app.init();
            const appConfig = yield app.getConfig();
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
            expressApp.use(express.static(path_1.resolve(path_1.join(appPath, "public"))));
            expressApp.get("/bundle." + env + ".js", (_, res) => res.sendFile(path_1.resolve(path_1.join(__dirname, "..", "dist", "bundle." + env + "." + this.engine + ".js"))));
            const sessionsManager = new SessionsManager_1.default({
                sessionsPath,
                sessionsStorage,
            });
            const seancesManager = new neweb_server_1.SeancesManager({
                app,
                sessionsManager,
            });
            // neweb
            const pageRenderer = this.engine === "react" ? new server_2.ServerPageRenderer({
                app,
            }) : new server_1.ServerPageRenderer({
                app,
            });
            const server = new neweb_server_1.Server({
                app,
                seancesManager,
                pageRenderer,
            });
            const modulesServer = new ModulesServer_1.default({
                modulesPath,
            });
            expressApp.get("/modules/:type/:name/:version.js", modulesServer.handle);
            const expressHandler = new ExpressHttpHandler_1.default({
                app: expressApp,
                server,
            });
            expressApp.use(session, expressHandler.handle);
            const httpServer = http_1.createServer(expressApp);
            // Setup SocketIO
            const io = SocketIO();
            io.use((socket, next) => {
                session(socket.request, socket.request.res, next);
            });
            io.on("connection", (socket) => {
                socket.on(neweb_core_1.RemoteMessageType.Initialize, ({ seanceId }) => __awaiter(this, void 0, void 0, function* () {
                    const socketClient = new SocketIOClient_1.default({
                        socket,
                        seanceId,
                    });
                    const request = yield socketClient.getRequest();
                    server.connectClient({
                        seanceId,
                        client: socketClient,
                        request,
                    });
                }));
            });
            io.attach(httpServer);
            // Start listening
            httpServer.listen(port, (err) => {
                if (err) {
                    debug("http")("Error server starting", err);
                    process.exit(1);
                    return;
                }
                debug("http")("Http server at port ", port);
            });
        });
    }
}
exports.default = ServerBootstrap;
