"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require("debug");
const neweb_browser_1 = require("neweb-browser");
const neweb_components_1 = require("neweb-components");
const neweb_core_1 = require("neweb-core");
const Neweb = require("./common");
if (process.env.NODE_ENV === "development") {
    debug.enable("*,-socket.io:*,-engine:*,-socket.io-client:*,-engine.io-client:*,-socket.io-client,-socket.io-parser");
}
const SocketIOClient = require("socket.io-client");
const initial = window[neweb_core_1.INITIAL_VAR];
const socket = SocketIOClient(window.location.protocol + "//" + window.location.host);
const modulesManager = new neweb_browser_1.ModulesManager({
    address: window.location.protocol + "//" + window.location.host + "/modules",
    modules: [{
            name: "neweb",
            version: undefined,
            type: "npm",
            content: "",
            exports: Neweb,
        },
    ],
});
const app = new neweb_browser_1.Application({
    modulesManager,
});
const pageRenderer = new neweb_components_1.ClientPageRenderer({
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
const realPushState = history.pushState.bind(history);
history.pushState = (url) => {
    seance.navigate(url);
    realPushState(url, "", url);
};
const logger = console;
seance.initialize(initial).then(() => {
    window.dispatchEvent(new Event("neweb-seans-initialized"));
    logger.log("Initialized");
});
window.global = window;
