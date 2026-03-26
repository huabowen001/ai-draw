import CONFIG from '../config.js';

const ALLOWED_ORIGINS = [
    'https://embed.diagrams.net',
    'https://viewer.diagrams.net'
];

class DrawioService {
    constructor() {
        this.frame = null;
        this.pendingXml = null;
        this.pendingAction = null;
        this.messageHandler = null;
    }

    init(frameElement, onInit, onExport) {
        this.frame = frameElement;
        this.onInit = onInit;
        this.onExport = onExport;
        
        this.messageHandler = (e) => this.handleMessage(e);
        window.addEventListener('message', this.messageHandler);
    }

    destroy() {
        if (this.messageHandler) {
            window.removeEventListener('message', this.messageHandler);
            this.messageHandler = null;
        }
    }

    isAllowedOrigin(origin) {
        return ALLOWED_ORIGINS.includes(origin);
    }

    handleMessage(e) {
        if (!this.isAllowedOrigin(e.origin)) return;

        let msg;
        try {
            msg = JSON.parse(e.data);
        } catch {
            return;
        }

        switch (msg.event) {
            case 'init':
                this.onInit?.();
                if (this.pendingXml) {
                    this.loadXml(this.pendingXml);
                    this.pendingXml = null;
                }
                break;

            case 'load':
                console.log('Diagram loaded');
                break;

            case 'export':
            case 'save':
                this.handleExport(msg);
                break;
        }
    }

    handleExport(msg) {
        let xml = msg.xml || msg.data;
        
        if (msg.data && typeof msg.data === 'string' && msg.data.includes('<mxfile')) {
            xml = msg.data;
        }

        if (xml) {
            this.onExport?.(xml, this.pendingAction);
            this.pendingAction = null;
        }
    }

    load(xml) {
        this.pendingXml = xml;
        const frameUrl = `${CONFIG.drawioUrl}?embed=1&ui=min&proto=json&spin=1&noSaveBtn=1&noExitBtn=1&saveAndExit=0`;
        this.frame.src = frameUrl;
        this.frame.style.display = 'block';
    }

    loadXml(xml) {
        this.postMessage({ action: 'load', xml });
    }

    export(action) {
        this.pendingAction = action;
        this.postMessage({ action: 'export', format: 'xml' });
    }

    zoom(factor) {
        this.postMessage({ action: 'zoom', factor });
    }

    postMessage(data) {
        if (this.frame?.contentWindow) {
            this.frame.contentWindow.postMessage(JSON.stringify(data), '*');
        }
    }
}

export default DrawioService;
