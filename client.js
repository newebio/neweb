"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const neweb_browser_1 = require("neweb-browser");
const neweb_core_1 = require("neweb-core");
const SocketIOClient = require("socket.io-client");
const initial = window[neweb_core_1.INITIAL_VAR];
const socket = SocketIOClient(window.location.protocol + "//" + window.location.host);
const modulesManager = new neweb_browser_1.ModulesManager({
    address: window.location.protocol + "//" + window.location.host + "/modules",
});
const app = new neweb_browser_1.Application({
    modulesManager,
});
const pageRenderer = new neweb_browser_1.PageRenderer({
    app,
    rootHtmlElement: document.getElementById("root"),
});
const pageMetaManager = new neweb_browser_1.PageMetaManager();
const seance = new neweb_browser_1.Seance({
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
