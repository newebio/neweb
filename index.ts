import { IHistoryContext } from ".";

export * from "neweb-core";
export { ClassicRouter, FrameController } from "neweb-server";
export interface IViewProps<P, D> {
    params: P;
    data: D;
    history: IHistoryContext;
    navigate: (url: string) => void;
    dispatch: (actionName: string, ...args: any[]) => Promise<void>;
}
