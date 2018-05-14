import { IHistoryContext } from ".";

export * from "neweb-core";
export * from "neweb-server";
export { default as SocketIOClient } from "./lib/SocketIOClient";
export { default as ModulesServer } from "./lib/ModulesServer";
export { default as SessionsManager } from "./lib/SessionsManager";
export { default as ServerBootstrap } from "./lib/ServerBootstrap";
export interface IViewProps<P, D> {
    params: P;
    data: D;
    history: IHistoryContext;
    navigate: (url: string) => void;
    dispatch: (actionName: string, ...args: any[]) => Promise<void>;
}
