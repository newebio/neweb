import { Application, ModulesManager, PageMetaManager, PageRenderer, Seance } from "neweb-browser";
import { INITIAL_VAR, ISeanceInitialInfo } from "neweb-core";

import SocketIOClient = require("socket.io-client");

const initial: ISeanceInitialInfo = (window as any)[INITIAL_VAR];
const socket = SocketIOClient(window.location.protocol + "//" + window.location.host);
const modulesManager = new ModulesManager({
    address: window.location.protocol + "//" + window.location.host + "/modules",
});
const app = new Application({
    modulesManager,
});
const pageRenderer = new PageRenderer({
    app,
    rootHtmlElement: document.getElementById("root"),
});
const pageMetaManager = new PageMetaManager();
const seance = new Seance({
    app,
    seanceId: initial.seanceId,
    socket,
    pageRenderer,
    pageMetaManager,
});
const logger = console;
seance.initialize(initial).then(() => {
    window.dispatchEvent(new Event("neweb-seans-initialized"));
    logger.log("Initialized");
});
