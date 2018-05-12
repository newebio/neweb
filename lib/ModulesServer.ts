import express = require("express");
import { createReadStream } from "fs";
import { IPackInfoModule } from "neweb-pack";
export interface IModuleServerConfig {
    modulesPath: string;
}
class ModuleServer {
    constructor(protected config: IModuleServerConfig) {

    }
    public handle = async (req: express.Request, res: express.Response) => {
        // app.get("/modules/:type/:name/:version.js", async (req, res) => {
        const { type, name: xName, version } = req.params;
        const name = xName.replace(/~/gi, "/");
        try {
            const mod = {
                name,
                type,
                version: version === "*" ? undefined : version,
            };
            const moduleStream = await this.getModuleContentStream(mod);
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
        } catch (e) {
            res.status(500).send(e.toString());
        }
        // });
    }
    protected async getModuleContentStream(moduleInfo: IPackInfoModule) {
        return createReadStream(this.config.modulesPath + "/" + moduleInfo.type + "/" + moduleInfo.name +
            "/" + moduleInfo.version + "/index.js");
    }
}
export default ModuleServer;
