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
const fs_1 = require("fs");
const mkdirp = require("mkdirp");
const path_1 = require("path");
const rxjs_1 = require("rxjs");
const util_1 = require("util");
class SessionsManager {
    constructor(config) {
        this.config = config;
        this.contexts = {};
    }
    getSessionContext(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.contexts[sessionId]) {
                this.contexts[sessionId] = yield this.createContext(sessionId);
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
            const saved = yield this.get(sessionId);
            if (saved) {
                Object.keys(saved).map((key) => {
                    context.set(key, saved[key]);
                });
            }
            return { data, context };
        });
    }
    get(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessionPath = this.getSessionPath(id);
            if (!(yield util_1.promisify(fs_1.exists)(sessionPath))) {
                return null;
            }
            try {
                const data = (yield util_1.promisify(fs_1.readFile)(sessionPath)).toString();
                return JSON.parse(data);
            }
            catch (e) {
                return null;
            }
        });
    }
    save(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = {};
            Object.keys(this.contexts[id].data).map((d) => {
                data[d] = this.contexts[id].data[d].value;
            });
            const sessionPath = this.getSessionPath(id);
            yield util_1.promisify(mkdirp)(path_1.dirname(sessionPath));
            yield util_1.promisify(fs_1.writeFile)(sessionPath, JSON.stringify(data));
        });
    }
    getSessionPath(id) {
        return path_1.resolve(path_1.join(this.config.sessionsPath, id, "sessions.json"));
    }
}
exports.default = SessionsManager;
