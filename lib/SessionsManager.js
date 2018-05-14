"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
class SessionsManager {
    constructor(config) {
        this.config = config;
        this.contexts = {};
    }
    getSessionContext(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.contexts[sessionId]) {
                yield this.createContext(sessionId);
            }
            return this.contexts[sessionId].context;
        });
    }
    createContext(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = {};
            const context = {
                get: (name) => {
                    return data[name] && data[name].hasValue ? data[name].value : null;
                },
                has: (name) => {
                    return data[name] && data[name].hasValue;
                },
                get$: (name) => {
                    if (!data[name]) {
                        data[name] = {
                            stream: new rxjs_1.Subject(),
                            value: undefined,
                            hasValue: false,
                        };
                    }
                    return data[name].stream;
                },
                set: (name, value) => __awaiter(this, void 0, void 0, function* () {
                    if (!data[name]) {
                        data[name] = {
                            stream: new rxjs_1.Subject(),
                            value: undefined,
                            hasValue: false,
                        };
                    }
                    data[name].value = value;
                    data[name].hasValue = true;
                    data[name].stream.next(value);
                    yield this.save(sessionId);
                }),
            };
            this.contexts[sessionId] = { data, context };
            const saved = yield this.get(sessionId);
            if (saved) {
                Object.keys(saved)
                    .filter((key) => key !== "id" && key !== "cookie" && key !== "__lastAccess")
                    .map((key) => {
                    context.set(key, saved[key]);
                });
            }
        });
    }
    get(sid) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
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
        });
    }
    save(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = {};
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
        });
    }
}
exports.default = SessionsManager;
