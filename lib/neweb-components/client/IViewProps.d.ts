import { Component } from "neweb-components";
import { BehaviorSubject, Observable } from "rxjs";
import { ISeanceContext } from "./../../ISeanceContext";

export interface IViewProps<PARAMS,
    DATA extends { [index: string]: any },
    CHILDREN extends { [index: string]: Component<any> }> {
    params: BehaviorSubject<PARAMS>;
    data: { [P in keyof DATA]: BehaviorSubject<DATA[P]> };
    children: BehaviorSubject<CHILDREN>;
    dispatch(actionName: string, ...args: any[]): void | Promise<void>;
    seance: ISeanceContext;
}
