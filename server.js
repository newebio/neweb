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
const ServerBootstrap_1 = require("./lib/ServerBootstrap");
function boostrap() {
    return __awaiter(this, void 0, void 0, function* () {
        const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
        const env = process.env.NODE_ENV === "production" ? "production" : "development";
        const server = new ServerBootstrap_1.default({
            port,
            rootPath: process.cwd(),
            env,
        });
        return server.start();
    });
}
exports.default = boostrap;
