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
const jsdom_1 = require("jsdom");
const neweb_components_1 = require("neweb-components");
const rxjs_1 = require("rxjs");
class PageRenderer {
    constructor(config) {
        this.config = config;
    }
    render(page) {
        return __awaiter(this, void 0, void 0, function* () {
            const views = yield this.resolveViewClasses(page);
            const dom = new jsdom_1.JSDOM(`<!doctype><html><body><div id="root"></div></body></html>`, {
                runScripts: "dangerously",
            });
            const window = dom.window;
            const document = new neweb_components_1.Document({
                window,
            });
            neweb_components_1.Component.setDocument(document);
            const rootComponent = this.renderFrame(page.rootFrame, page, views);
            rootComponent.mount();
            const root = window.document.querySelector("#root");
            root.appendChild(rootComponent.getRootElement());
            const html = root.innerHTML;
            // window.close();
            return html;
        });
    }
    renderFrame(frameId, page, views) {
        const pageFrame = page.frames.filter((f) => f.frameId === frameId)[0];
        const FrameView = views[pageFrame.frameId];
        if (!FrameView) {
            throw new Error("Not found frame " + pageFrame.frameName);
        }
        const children = {};
        Object.keys(pageFrame.frames).map((placeName) => __awaiter(this, void 0, void 0, function* () {
            const childFrameId = pageFrame.frames[placeName];
            // const childFrame = page.frames.filter((f) => f.frameId === childFrameId)[0];
            children[placeName] = this.renderFrame(childFrameId, page, views);
        }));
        const data = {};
        Object.keys(pageFrame.data).map((dataName) => {
            data[dataName] = new rxjs_1.BehaviorSubject(pageFrame.data[dataName]);
        });
        const component = new FrameView({
            data,
            children: new rxjs_1.BehaviorSubject(children),
            params: new rxjs_1.BehaviorSubject(pageFrame.params),
            seance: {
                networkStatus: rxjs_1.of("disconnected"),
                navigateStatus: rxjs_1.of("ready"),
            },
        });
        return component;
    }
    resolveViewClasses(page) {
        return __awaiter(this, void 0, void 0, function* () {
            const views = {};
            yield Promise.all(page.frames.map((pageFrame) => __awaiter(this, void 0, void 0, function* () {
                views[pageFrame.frameId] = yield this.config.app.getFrameViewClass(pageFrame.frameName);
            })));
            return views;
        });
    }
}
exports.default = PageRenderer;
