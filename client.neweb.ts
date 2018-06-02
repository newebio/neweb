import debug = require("debug");
import { Application, ModulesManager, PageMetaManager, Seance } from "neweb-browser";
import { Component, Document } from "neweb-components";
import { INITIAL_VAR, ISeanceInitialInfo } from "neweb-core";
import Neweb = require("./common");
import ClientPageRenderer from "./lib/neweb-components/client/ClientPageRenderer";
if (process.env.NODE_ENV === "development") {
    debug.enable(
        "*,-socket.io:*,-engine:*,-socket.io-client:*,-engine.io-client:*,-socket.io-client,-socket.io-parser");
}
import SocketIOClient = require("socket.io-client");
const doc = new Document({
    window,
});
Component.setDocument(doc);
const initial: ISeanceInitialInfo = (window as any)[INITIAL_VAR];
const socket = SocketIOClient(window.location.protocol + "//" + window.location.host);
const modulesManager = new ModulesManager({
    address: window.location.protocol + "//" + window.location.host + "/modules",
    modules: [{
        name: "neweb",
        version: undefined,
        type: "npm",
        content: "",
        exports: Neweb,
    },
        /*{
        name: "react",
        version: undefined,
        type: "npm",
        content: "",
        exports: React,
    },
    {
        name: "react-dom",
        version: undefined,
        type: "npm",
        content: "",
        exports: ReactDOM,
    }*/],
});
const app = new Application({
    modulesManager,
});
const pageRenderer = new ClientPageRenderer({
    app,
    rootHtmlElement: document.getElementById("root") as HTMLElement,
});
const pageMetaManager = new PageMetaManager();
const seance = new Seance({
    app,
    seanceId: initial.seanceId,
    socket,
    pageRenderer,
    pageMetaManager,
});
const realPushState = history.pushState.bind(history);
history.pushState = (url: string) => {
    seance.navigate(url);
    realPushState(url, "", url);
};
window.addEventListener("popstate", (e) => {
    seance.navigate(e.state);
});
const logger = console;
seance.initialize(initial).then(() => {
    window.dispatchEvent(new Event("neweb-seans-initialized"));
    logger.log("Initialized");
});
(window as any).global = window;
