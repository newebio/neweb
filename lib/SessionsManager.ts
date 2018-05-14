import { Store } from "express-session";
import { ISessionContext, ISessionsManager } from "neweb-server";
import { Subject } from "rxjs";
export interface ISessionsManagerConfig {
    sessionsPath: string;
    sessionsStorage: Store;
}
class SessionsManager implements ISessionsManager {
    protected contexts: {
        [index: string]: {
            context: ISessionContext<any>;
            data: {
                [index: string]: {
                    stream: Subject<any>;
                    value: any;
                    hasValue: boolean;
                };
            };
        };
    } = {};
    constructor(protected config: ISessionsManagerConfig) { }
    public async getSessionContext(sessionId: string) {
        if (!this.contexts[sessionId]) {
            await this.createContext(sessionId);
        }
        return this.contexts[sessionId].context;
    }
    public async createContext(sessionId: string) {
        const data: {
            [index: string]: {
                stream: Subject<any>;
                value: any;
                hasValue: boolean;
            };
        } = {};
        const context: ISessionContext<any> = {
            get: (name: string) => {
                return data[name] && data[name].hasValue ? data[name].value : null;
            },
            has: (name: string) => {
                return data[name] && data[name].hasValue;
            },
            get$: (name: string) => {
                if (!data[name]) {
                    data[name] = {
                        stream: new Subject(),
                        value: undefined,
                        hasValue: false,
                    };
                }
                return data[name].stream;
            },
            set: async (name: string, value: any) => {
                if (!data[name]) {
                    data[name] = {
                        stream: new Subject(),
                        value: undefined,
                        hasValue: false,
                    };
                }
                data[name].value = value;
                data[name].hasValue = true;
                data[name].stream.next(value);
                await this.save(sessionId);
            },
        };
        this.contexts[sessionId] = { data, context };
        const saved = await this.get(sessionId);
        if (saved) {
            Object.keys(saved)
                .map((key) => {
                    data[key] = {
                        value: saved[key],
                        hasValue: true,
                        stream: new Subject(),
                    };
                });
            Object.keys(saved)
                .filter((key) => key !== "id" && key !== "cookie" && key !== "__lastAccess")
                .map((key) => {
                    context.set(key, saved[key]);
                });
        }
    }
    public async get(sid: string): Promise<any | null> {
        return new Promise<any>((resolve, reject) => {
            this.config.sessionsStorage.get(sid, (err, session) => {
                if (err) {
                    if (err.code === "ENOENT") {
                        resolve(null);
                        return;
                    }
                    reject(err);
                    return;
                }
                resolve(session);
            });
        });
    }
    public async save(id: string) {
        const data: any = {};
        Object.keys(this.contexts[id].data).map((d) => {
            data[d] = this.contexts[id].data[d].value;
        });
        return new Promise((resolve, reject) => {
            this.config.sessionsStorage.set(id, data, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }
}
export default SessionsManager;
