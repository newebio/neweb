import { JSDOM } from "jsdom";
import { Component, Document } from "neweb-components";
import { IPage } from "neweb-core";
import { BehaviorSubject, Observable } from "rxjs";
export interface IPageRendererConfig {
    app: {
        getFrameViewClass: (frameName: string) => any;
    };
}
class PageRenderer {
    constructor(protected config: IPageRendererConfig) { }
    public async render(page: IPage) {
        const views = await this.resolveViewClasses(page);
        const dom = new JSDOM(`<!doctype><html><body><div id="root"></div></body></html>`, {
            runScripts: "dangerously",
        });
        const window = dom.window;
        const document = new Document({
            window,
        });
        Component.setDocument(document);
        const rootComponent = this.renderFrame(page.rootFrame, page, views);
        rootComponent.mount();
        const root = window.document.querySelector("#root") as HTMLElement;
        root.appendChild(rootComponent.getRootElement());
        const html = root.innerHTML;
        // window.close();
        return html;
    }
    protected renderFrame(
        frameId: string, page: IPage,
        views: { [index: string]: any },
    ): Component<any> {
        const pageFrame = page.frames.filter((f) => f.frameId === frameId)[0];
        const FrameView = views[pageFrame.frameId];
        if (!FrameView) {
            throw new Error("Not found frame " + pageFrame.frameName);
        }
        const children: { [index: string]: Component<any> } = {};
        Object.keys(pageFrame.frames).map(async (placeName) => {
            const childFrameId = pageFrame.frames[placeName];
            // const childFrame = page.frames.filter((f) => f.frameId === childFrameId)[0];
            children[placeName] = this.renderFrame(childFrameId, page, views);
        });
        const data: { [index: string]: Observable<any> } = {};
        Object.keys(pageFrame.data).map((dataName) => {
            data[dataName] = new BehaviorSubject(pageFrame.data[dataName]);
        });
        const component = new FrameView({
            data,
            children: new BehaviorSubject(children),
            params: new BehaviorSubject(pageFrame.params),
        });
        return component;
    }
    protected async resolveViewClasses(page: IPage) {
        const views: { [index: string]: any } = {};
        await Promise.all(page.frames.map(async (pageFrame) => {
            views[pageFrame.frameId] = await this.config.app.getFrameViewClass(pageFrame.frameName);
        }));
        return views;
    }
}
export default PageRenderer;
