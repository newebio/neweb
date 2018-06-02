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
const debug = require("debug");
const neweb_components_1 = require("neweb-components");
const BehaviorSubject_1 = require("rxjs/BehaviorSubject");
class ClientPageRenderer {
    constructor(config) {
        this.config = config;
        this.views = {};
        this.frames = {};
    }
    setMethods(params) {
        this.navigate = params.navigate;
        this.dispatch = params.dispatch;
        this.seansStatusEmitter = params.seansStatusEmitter;
        this.networkStatusEmitter = params.networkStatusEmitter;
        this.historyContext = params.historyContext;
    }
    loadPage(page) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadViews(page);
            // create all frames
            page.frames.map((pageFrame) => {
                this.frames[pageFrame.frameId] = this.createFrame(pageFrame);
            });
            this.renderFrame(page.rootFrame, page);
            this.currentPage = page;
        });
    }
    newPage(page) {
        return __awaiter(this, void 0, void 0, function* () {
            debug("neweb:renderer")("new page", page);
            yield this.loadViews(page);
            const frameIds = [];
            page.frames.map((frame) => __awaiter(this, void 0, void 0, function* () {
                if (!this.frames[frame.frameId]) {
                    this.frames[frame.frameId] = this.createFrame(frame);
                    frameIds.push(frame.frameId);
                }
                else {
                    const xFrame = this.frames[frame.frameId];
                    if (JSON.stringify(xFrame.params.getValue()) !== frame.params) {
                        xFrame.params.next(frame.params);
                    }
                }
            }));
            // frameIds.map((frameId) => this.renderFrame(frameId, page));
            this.renderFrame(page.rootFrame, page);
            // TODO delete old frames
            if (this.currentPage.rootFrame !== page.rootFrame) {
                neweb_components_1.replace(this.frames[page.rootFrame].component, this.config.rootHtmlElement);
            }
            this.currentPage = page;
        });
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            neweb_components_1.hydrate(this.frames[this.currentPage.rootFrame].component, this.config.rootHtmlElement);
        });
    }
    emitFrameControllerData(params) {
        const frame = this.frames[params.frameId];
        if (frame) {
            frame.data[params.fieldName].next(params.value);
        }
    }
    loadViews(page) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(page.frames.map((pageFrame) => __awaiter(this, void 0, void 0, function* () {
                this.views[pageFrame.frameName] = yield this.config.app.getFrameViewClass(pageFrame);
            })));
        });
    }
    renderFrame(frameId, page) {
        const frame = this.frames[frameId];
        const pageFrame = page.frames.filter((f) => f.frameId === frameId)[0];
        const children = {};
        Object.keys(pageFrame.frames).map((placeName) => {
            const childFrameId = pageFrame.frames[placeName];
            this.renderFrame(childFrameId, page);
            const childFrame = this.frames[childFrameId];
            children[placeName] = childFrame.component;
        });
        frame.children.next(children);
    }
    createFrame(pageFrame) {
        const ViewClass = this.views[pageFrame.frameName];
        const data = {};
        Object.keys(pageFrame.data).map((dataName) => {
            data[dataName] = new BehaviorSubject_1.BehaviorSubject(pageFrame.data[dataName]);
        });
        const children = new BehaviorSubject_1.BehaviorSubject({});
        const params = new BehaviorSubject_1.BehaviorSubject(pageFrame.params);
        const component = new ViewClass({
            data,
            children,
            params,
            navigate: this.navigate,
            dispatch: (actionName, ...args) => this.dispatch({
                frameId: pageFrame.frameId,
                actionName,
                args,
            }),
        });
        return {
            pageFrame,
            component,
            data,
            children,
            params,
        };
    }
}
exports.default = ClientPageRenderer;
