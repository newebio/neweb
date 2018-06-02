import { Component } from "neweb-components";
import { Observable } from "rxjs";

export interface IViewParams<PARAMS,
    DATA extends Observable<{ [index: string]: any }>,
    CHILDREN extends Observable<{ [index: string]: Component<any> }>> {
    params: PARAMS;
    data: DATA;
    children: CHILDREN;
    dispatch(actionName: string, ...args: any[]): void | Promise<void>;
    navigate(url: string): void;
}
