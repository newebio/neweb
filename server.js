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
const express = require("express");
const expressSession = require("express-session");
const http_1 = require("http");
const neweb_core_1 = require("neweb-core");
const neweb_pack_1 = require("neweb-pack");
const neweb_server_1 = require("neweb-server");
const path_1 = require("path");
const SocketIO = require("socket.io");
const ModulesServer_1 = require("./lib/ModulesServer");
const SocketIOClient_1 = require("./lib/SocketIOClient");
function boostrap() {
    return __awaiter(this, void 0, void 0, function* () {
        const appPath = path_1.resolve(path_1.join(process.cwd(), "app"));
        const port = process.env.PORT || 5000;
        const env = process.env.NODE_ENV === "production" ? "production" : "development";
        const expressApp = express();
        // static
        expressApp.use(express.static(path_1.resolve(path_1.join(appPath, "public"))));
        expressApp.get("/bundle.js", (_, res) => res.sendFile(path_1.resolve(path_1.join(__dirname, "dist", "bundle.js"))));
        const modulesPath = path_1.join(appPath, "..", "modules");
        const modulePacker = new neweb_pack_1.ModulePacker({
            appRoot: appPath,
            excludedModules: ["react", "react-dom", "neweb"],
            modulesPath,
            REQUIRE_FUNC_NAME: neweb_core_1.REQUIRE_FUNC_NAME,
        });
        const app = new neweb_server_1.Application({
            appDir: appPath,
            env,
            modulePacker,
        });
        yield app.init();
        const seancesManager = new neweb_server_1.SeancesManager({
            app,
        });
        // neweb
        const server = new neweb_server_1.Server({
            app,
            seancesManager,
        });
        const modulesServer = new ModulesServer_1.default({
            modulesPath,
        });
        expressApp.get("/modules/:type/:name/:version.js", modulesServer.handle);
        const session = expressSession({
            secret: "12345",
            saveUninitialized: true,
            resave: true,
        });
        expressApp.use(session, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            // try {
            const response = yield server.resolveRequest({
                url: req.url,
                sessionId: req.session.id,
                headers: req.headers,
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
        }));
        const httpServer = http_1.createServer(expressApp);
        httpServer.listen(port, (err) => {
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
            socket.on(neweb_core_1.RemoteMessageType.Initialize, ({ seanceId }) => __awaiter(this, void 0, void 0, function* () {
                const socketClient = new SocketIOClient_1.default({
                    socket,
                    seanceId,
                });
                server.connectClient({
                    seanceId,
                    client: socketClient,
                    request: yield socketClient.getRequest(),
                });
            }));
        });
    });
}
exports.default = boostrap;