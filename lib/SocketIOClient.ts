import expressSession = require("express-session");
import {
    INewControllerDataParams, IRemoteClient, IRemoteClientMessage, IRemoteErrorParams,
    IRemoteNewPageParams, IRemoteServer, IRemoteServerMessage, RemoteMessageType,
} from "neweb-core";
import { IServerRequest } from "neweb-server";
import SocketIO = require("socket.io");

export interface ISocketIOServerConfig {
    socket: IRemoteSocketClient;
    seanceId: string;
}
export interface IRemoteSocketClient extends SocketIO.Socket {
    on(event: "disconnect" | "error", cb: () => void): this;
    on<P extends keyof IRemoteServerMessage>(eventName: P, cb: (params: IRemoteServerMessage[P]) => void):
        this;
}
class SocketIOClient implements IRemoteClient {
    protected server: IRemoteServer;
    constructor(protected config: ISocketIOServerConfig) {
        this.config.socket.on("disconnect", this.dispose);
        this.config.socket.on("error", this.dispose);
        this.config.socket.on(RemoteMessageType.FrameControllerDispatch, (params) => {
            this.server.dispatchControllerAction({
                actionName: params.actionName,
                args: params.args,
                controllerId: params.frameId,
            });
        });
    }
    public async getRequest(): Promise<IServerRequest> {
        const socket = this.config.socket;
        const request = {
            clientIpAddress: socket.conn.remoteAddress,
            headers: socket.request.headers,
            url: "",
            hostname: "",
            sessionId: "",
            session: undefined as any,
        };
        await new Promise((resolve) => expressSession({
            secret: "12345",
        })(request as any, {} as any, resolve));
        request.sessionId = request.session.id;
        return request;
    }
    public connectTo(server: IRemoteServer) {
        this.server = server;
    }
    public newPage(params: IRemoteNewPageParams) {
        return this.emit(RemoteMessageType.NewPage, params);
    }
    public newControllerData(params: INewControllerDataParams) {
        return this.emit(RemoteMessageType.FrameControllerData, {
            frameId: params.controllerId,
            data: params.data,
        });
    }
    public error(params: IRemoteErrorParams) {
        return this.emit(RemoteMessageType.Error, params);
    }
    public async emit<P extends keyof IRemoteClientMessage>(event: P, params: IRemoteClientMessage[P]) {
        await new Promise((resolve) => {
            this.config.socket.send(event, params, resolve);
        });
    }
    public dispose = () => {
        this.config.socket.removeAllListeners();
    }
}
export default SocketIOClient;
