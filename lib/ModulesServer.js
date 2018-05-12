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
class ModuleServer {
    constructor(config) {
        this.config = config;
        this.handle = (req, res) => __awaiter(this, void 0, void 0, function* () {
            // app.get("/modules/:type/:name/:version.js", async (req, res) => {
            const { type, name: xName, version } = req.params;
            const name = xName.replace(/~/gi, "/");
            try {
                const mod = {
                    name,
                    type,
                    version: version === "*" ? undefined : version,
                };
                const moduleStream = yield this.getModuleContentStream(mod);
                moduleStream.on("error", (e) => {
                    if (e.toString().indexOf("ENOENT") > -1) {
                        res.status(404).send("Not found module::" + JSON.stringify(mod));
                        return;
                    }
                    res.status(500).send(e.toString());
                });
                moduleStream.on("open", () => {
                    res.writeHead(200, {
                        "Content-Type": "application/json",
                    });
                    moduleStream.pipe(res);
                });
                moduleStream.on("close", () => {
                    res.end();
                });
            }
            catch (e) {
                res.status(500).send(e.toString());
            }
            // });
        });
    }
    getModuleContentStream(moduleInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            return fs_1.createReadStream(this.config.modulesPath + "/" + moduleInfo.type + "/" + moduleInfo.name +
                "/" + moduleInfo.version + "/index.js");
        });
    }
}
exports.default = ModuleServer;
