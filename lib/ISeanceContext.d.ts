import { Observable } from "rxjs";

export interface ISeanceContext {
    navigate(url: string): void;
    networkStatus: Observable<NetworkStatus>;
    navigateStatus: Observable<NavigateStatus>;
}
export type NavigateStatus = "ready" | "navigating";
export type NetworkStatus = "connected" | "connecting" | "disconnected";
