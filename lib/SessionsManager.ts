import { exists, readFile, writeFile } from "fs";
import mkdirp = require("mkdirp");
import { ISessionContext, ISessionsManager } from "neweb-server";
import { dirname, join, resolve } from "path";
import { Subject } from "rxjs";
import { promisify } from "util";
export interface ISessionsManagerConfig {
    sessionsPath: string;
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
            this.contexts[sessionId] = await this.createContext(sessionId);
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
        const saved = await this.get(sessionId);
        if (saved) {
            Object.keys(saved).map((key) => {
                context.set(key, saved[key]);
            });
        }
        return { data, context };
    }
    public async get(id: string): Promise<any | null> {
        const sessionPath = this.getSessionPath(id);
        if (!await promisify(exists)(sessionPath)) {
            return null;
        }
        try {
            const data = (await promisify(readFile)(sessionPath)).toString();
            return JSON.parse(data);
        } catch (e) {
            return null;
        }
    }
    public async save(id: string) {
        const data: any = {};
        Object.keys(this.contexts[id].data).map((d) => {
            data[d] = this.contexts[id].data[d].value;
        });
        const sessionPath = this.getSessionPath(id);
        await promisify(mkdirp)(dirname(sessionPath));
        await promisify(writeFile)(sessionPath, JSON.stringify(data));
    }
    protected getSessionPath(id: string) {
        return resolve(join(this.config.sessionsPath, id, "sessions.json"));
    }
}
export default SessionsManager;
