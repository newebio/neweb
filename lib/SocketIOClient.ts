import {
    INewControllerDataParams, IRemoteClient, IRemoteClientMessage,
    IRemoteErrorParams, IRemoteNewPageParams, IRemoteServer, IRemoteServerMessage, RemoteMessageType,
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
        this.config.socket.on(RemoteMessageType.Navigate, (params) => {
            this.server.navigate(params);
        });
    }
    public async getRequest(): Promise<IServerRequest> {
        const socket = this.config.socket;
        return {
            url: socket.request.url,
            headers: socket.request.headers,
            sessionId: socket.request.session.id,
        };
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
            fieldName: params.fieldName,
            value: params.value,
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
