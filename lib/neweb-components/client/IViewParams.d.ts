import { Component } from "neweb-components";

export interface IViewParams<PARAMS, DATA, CHILDREN extends { [index: string]: Component<any> }> {
    params: PARAMS;
    data: DATA;
    children: CHILDREN;
    dispatch(actionName: string, ...args: any[]): void | Promise<void>;
    navigate(url: string): void;
}
