import express = require("express");
import { Server } from "neweb-server";
export interface IExpressHttpHandler {
    app: express.Express;
    server: Server;
}
class ExpressHttpHandler {
    constructor(protected config: IExpressHttpHandler) { }
    public handle: express.RequestHandler = async (req: express.Request, res: express.Response, next) => {
        // try {
        const server = this.config.server;
        const response = await server.resolveRequest({
            url: req.url,
            sessionId: (req.session as Express.Session).id,
            headers: req.headers as any,
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
    }
}
export default ExpressHttpHandler;
