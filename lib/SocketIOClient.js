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
const expressSession = require("express-session");
const neweb_core_1 = require("neweb-core");
class SocketIOClient {
    constructor(config) {
        this.config = config;
        this.dispose = () => {
            this.config.socket.removeAllListeners();
        };
        this.config.socket.on("disconnect", this.dispose);
        this.config.socket.on("error", this.dispose);
        this.config.socket.on(neweb_core_1.RemoteMessageType.FrameControllerDispatch, (params) => {
            this.server.dispatchControllerAction({
                actionName: params.actionName,
                args: params.args,
                controllerId: params.frameId,
            });
        });
    }
    getRequest() {
        return __awaiter(this, void 0, void 0, function* () {
            const socket = this.config.socket;
            const request = {
                clientIpAddress: socket.conn.remoteAddress,
                headers: socket.request.headers,
                url: "",
                hostname: "",
                sessionId: "",
                session: undefined,
            };
            yield new Promise((resolve) => expressSession({
                secret: "12345",
            })(request, {}, resolve));
            request.sessionId = request.session.id;
            return request;
        });
    }
    connectTo(server) {
        this.server = server;
    }
    newPage(params) {
        return this.emit(neweb_core_1.RemoteMessageType.NewPage, params);
    }
    newControllerData(params) {
        return this.emit(neweb_core_1.RemoteMessageType.FrameControllerData, {
            frameId: params.controllerId,
            data: params.data,
        });
    }
    error(params) {
        return this.emit(neweb_core_1.RemoteMessageType.Error, params);
    }
    emit(event, params) {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise((resolve) => {
                this.config.socket.send(event, params, resolve);
            });
        });
    }
}
exports.default = SocketIOClient;
