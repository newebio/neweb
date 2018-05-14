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
class ExpressHttpHandler {
    constructor(config) {
        this.config = config;
        this.handle = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            // try {
            const server = this.config.server;
            const response = yield server.resolveRequest({
                url: req.url,
                sessionId: req.session.id,
                headers: req.headers,
            });
            Object.keys(response.headers).map((key) => {
                res.header(key, response.headers[key]);
            });
            if (response.type === "NotFound") {
                next();
                return;
            }
            if (response.type === "Redirect") {
                res.status(301).send(response.body);
                return;
            }
            res.send(response.body);
            /*} catch (e) {
                res.status(500).send(env === "development" ?
                    (e.toString() + "\n" + e.stack).replace(/\n/gi, "<br />") : "Unknown error");
            }*/
        });
    }
}
exports.default = ExpressHttpHandler;
