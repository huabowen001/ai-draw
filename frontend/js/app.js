import CONFIG from './config.js';
import { appState } from './core/state.js';
import apiService from './services/api.js';
import fileService from './services/file.js';
import DrawioService from './services/drawio.js';
import Toast from './ui/toast.js';
import Modal from './ui/modal.js';

class App {
    constructor() {
        this.elements = {};
        this.drawioService = new DrawioService();
        this.modals = {};
        
        this.init();
    }

    init() {
        this.cacheElements();
        this.initServices();
        this.bindEvents();
        this.subscribeToState();
    }

    cacheElements() {
        this.elements = {
            fileInput: document.getElementById('fileInput'),
            newBtn: document.getElementById('newBtn'),
            aiGenerateBtn: document.getElementById('aiGenerateBtn'),
            selectFileBtn: document.getElementById('selectFileBtn'),
            fileInfo: document.getElementById('fileInfo'),
            fileName: document.getElementById('fileName'),
            errorMessage: document.getElementById('errorMessage'),
            placeholder: document.getElementById('placeholder'),
            loading: document.getElementById('loading'),
            drawioFrame: document.getElementById('drawioFrame'),
            downloadBtn: document.getElementById('downloadBtn'),
            previewBtn: document.getElementById('previewBtn'),
            zoomControls: document.getElementById('zoomControls'),
            aiPrompt: document.getElementById('aiPrompt'),
            aiPromptLabel: document.getElementById('aiPromptLabel'),
            confirmAiBtn: document.getElementById('confirmAiBtn'),
            cancelAiBtn: document.getElementById('cancelAiBtn')
        };

        this.modals = {
            xml: new Modal(document.getElementById('xmlModal')),
            ai: new Modal(document.getElementById('aiModal'))
        };

        this.modals.xml.onShow = () => {
            const content = appState.get('currentXml');
            if (content) {
                const truncated = content.length > CONFIG.maxXmlPreviewLength
                    ? content.substring(0, CONFIG.maxXmlPreviewLength) + '\n\n... (内容已截断)'
                    : content;
                document.getElementById('xmlContent').textContent = truncated;
            }
        };
    }

    initServices() {
        this.drawioService.init(
            this.elements.drawioFrame,
            () => this.onDrawioReady(),
            (xml, action) => this.onDrawioExport(xml, action)
        );
    }

    onDrawioReady() {
        this.setLoading(false);
        this.elements.zoomControls.style.display = 'flex';
    }

    onDrawioExport(xml, action) {
        appState.set('currentXml', xml);
        
        if (action === 'preview') {
            this.modals.xml.show();
        } else if (action === 'download') {
            const file = appState.get('currentFile');
            fileService.download(xml, file?.name || 'diagram.drawio');
        }
    }

    bindEvents() {
        const { elements } = this;

        elements.newBtn.addEventListener('click', () => this.createNewDiagram());
        elements.aiGenerateBtn.addEventListener('click', () => this.showAiModal());
        elements.selectFileBtn.addEventListener('click', () => {
            elements.fileInput.value = '';
            elements.fileInput.click();
        });

        elements.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFile(e.target.files[0]);
            }
        });

        elements.downloadBtn.addEventListener('click', () => this.downloadFile());
        elements.previewBtn.addEventListener('click', () => this.previewXml());

        elements.confirmAiBtn.addEventListener('click', () => this.generateWithAi());
        elements.cancelAiBtn.addEventListener('click', () => this.modals.ai.hide());

        document.querySelectorAll('input[name="aiMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.updatePromptLabel(e.target.value));
        });

        document.getElementById('zoomIn').addEventListener('click', () => this.drawioService.zoom(1.2));
        document.getElementById('zoomOut').addEventListener('click', () => this.drawioService.zoom(0.8));
        document.getElementById('zoomReset').addEventListener('click', () => this.drawioService.zoom(1));
    }

    subscribeToState() {
        appState.subscribe('isLoading', (loading) => {
            this.setLoading(loading);
        });

        appState.subscribe('error', (error) => {
            if (error) {
                this.showError(error);
            } else {
                this.hideError();
            }
        });

        appState.subscribe('currentFile', (file) => {
            this.elements.fileName.textContent = file 
                ? `已选择: ${file.name}` 
                : '新建图表';
            this.elements.fileInfo.classList.add('show');
        });

        appState.subscribe('currentXml', (xml) => {
            const hasXml = !!xml;
            this.elements.downloadBtn.disabled = !hasXml;
            this.elements.previewBtn.disabled = !hasXml;
        });
    }

    async handleFile(file) {
        const validation = fileService.validateFile(file);
        if (!validation.valid) {
            Toast.error(validation.error);
            return;
        }

        appState.set('error', null);

        try {
            appState.set('isLoading', true);
            const content = await fileService.readFile(file);
            
            appState.set('currentFile', file);
            appState.set('currentXml', content);
            
            this.drawioService.load(content);
            this.elements.placeholder.style.display = 'none';
        } catch (error) {
            appState.set('error', error.message);
            Toast.error(error.message);
        } finally {
            appState.set('isLoading', false);
        }
    }

    createNewDiagram() {
        appState.set('error', null);
        appState.set('currentFile', null);
        
        const emptyXml = fileService.createEmptyDiagram();
        appState.set('currentXml', emptyXml);
        
        this.drawioService.load(emptyXml);
        this.elements.placeholder.style.display = 'none';
    }

    downloadFile() {
        this.drawioService.export('download');
    }

    previewXml() {
        this.drawioService.export('preview');
    }

    showAiModal() {
        this.elements.aiPrompt.value = '';
        
        const hasCurrentXml = !!appState.get('currentXml');
        const newRadio = document.querySelector('input[name="aiMode"][value="new"]');
        const optimizeRadio = document.querySelector('input[name="aiMode"][value="optimize"]');
        
        optimizeRadio.disabled = !hasCurrentXml;
        
        if (hasCurrentXml) {
            optimizeRadio.checked = true;
            this.updatePromptLabel('optimize');
        } else {
            newRadio.checked = true;
            this.updatePromptLabel('new');
        }
        
        this.modals.ai.show();
    }

    updatePromptLabel(mode) {
        const { aiPromptLabel, aiPrompt } = this.elements;
        
        if (mode === 'optimize') {
            aiPromptLabel.textContent = '描述你想要的优化方向：';
            aiPrompt.placeholder = '例如：增加错误处理流程、优化布局、添加注释说明等';
        } else {
            aiPromptLabel.textContent = '描述你想要生成的图表：';
            aiPrompt.placeholder = '例如：生成一个用户登录流程图，包含输入用户名密码、验证、登录成功/失败等步骤';
        }
    }

    async generateWithAi() {
        const prompt = this.elements.aiPrompt.value.trim();
        if (!prompt) {
            Toast.warning('请输入图表描述');
            return;
        }

        const mode = appState.get('currentXml')
            ? document.querySelector('input[name="aiMode"]:checked').value
            : 'new';

        this.modals.ai.hide();
        appState.set('error', null);
        appState.set('isLoading', true);

        try {
            const currentXml = mode === 'optimize' ? appState.get('currentXml') : null;
            const result = await apiService.generateDiagram(prompt, currentXml);

            if (result.success && result.xml_content) {
                appState.set('currentXml', result.xml_content);
                appState.set('currentFile', null);
                
                if (this.elements.drawioFrame.style.display === 'block') {
                    this.drawioService.loadXml(result.xml_content);
                } else {
                    this.drawioService.load(result.xml_content);
                    this.elements.placeholder.style.display = 'none';
                }
                
                Toast.success(mode === 'optimize' ? '图表优化成功' : '图表生成成功');
            } else {
                throw new Error(result.message || '生成失败');
            }
        } catch (error) {
            appState.set('error', error.message);
            Toast.error(`AI生成失败: ${error.message}`);
        } finally {
            appState.set('isLoading', false);
        }
    }

    setLoading(loading) {
        this.elements.loading.classList.toggle('show', loading);
    }

    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.classList.add('show');
    }

    hideError() {
        this.elements.errorMessage.classList.remove('show');
    }
}

export default App;
