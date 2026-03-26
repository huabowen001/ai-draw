class DrawioViewer {
    constructor() {
        this.currentFile = null;
        this.currentXml = null;
        this.drawioUrl = 'https://embed.diagrams.net';
        this.pendingAction = null;
        this.apiBaseUrl = 'http://localhost:8001/api/v1';
        this.init();
    }

    init() {
        this.fileInput = document.getElementById('fileInput');
        this.newBtn = document.getElementById('newBtn');
        this.aiGenerateBtn = document.getElementById('aiGenerateBtn');
        this.selectFileBtn = document.getElementById('selectFileBtn');
        this.fileInfo = document.getElementById('fileInfo');
        this.fileName = document.getElementById('fileName');
        this.errorMessage = document.getElementById('errorMessage');
        this.placeholder = document.getElementById('placeholder');
        this.loading = document.getElementById('loading');
        this.drawioFrame = document.getElementById('drawioFrame');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.previewBtn = document.getElementById('previewBtn');
        this.xmlModal = document.getElementById('xmlModal');
        this.xmlContent = document.getElementById('xmlContent');
        this.closeModal = document.getElementById('closeModal');
        this.zoomControls = document.getElementById('zoomControls');
        this.viewerContainer = document.getElementById('viewerContainer');
        
        this.aiModal = document.getElementById('aiModal');
        this.aiPrompt = document.getElementById('aiPrompt');
        this.aiModeSelection = document.getElementById('aiModeSelection');
        this.aiPromptLabel = document.getElementById('aiPromptLabel');
        this.closeAiModal = document.getElementById('closeAiModal');
        this.cancelAiBtn = document.getElementById('cancelAiBtn');
        this.confirmAiBtn = document.getElementById('confirmAiBtn');

        this.bindEvents();
    }

    bindEvents() {
        this.newBtn.addEventListener('click', () => this.createNewDiagram());
        this.aiGenerateBtn.addEventListener('click', () => this.showAiModal());
        this.selectFileBtn.addEventListener('click', () => {
            this.fileInput.value = '';
            this.fileInput.click();
        });
        
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFile(e.target.files[0]);
            }
        });

        this.downloadBtn.addEventListener('click', () => this.downloadFile());
        this.previewBtn.addEventListener('click', () => this.showXmlModal());
        this.closeModal.addEventListener('click', () => this.hideXmlModal());
        this.xmlModal.addEventListener('click', (e) => {
            if (e.target === this.xmlModal) {
                this.hideXmlModal();
            }
        });

        this.closeAiModal.addEventListener('click', () => this.hideAiModal());
        this.cancelAiBtn.addEventListener('click', () => this.hideAiModal());
        this.confirmAiBtn.addEventListener('click', () => this.generateWithAi());
        this.aiModal.addEventListener('click', (e) => {
            if (e.target === this.aiModal) {
                this.hideAiModal();
            }
        });

        document.querySelectorAll('input[name="aiMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleModeChange(e));
        });

        document.getElementById('zoomIn').addEventListener('click', () => this.zoom(1.2));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoom(0.8));
        document.getElementById('zoomReset').addEventListener('click', () => this.zoomReset());

        window.addEventListener('message', (e) => this.handleFrameMessage(e));
    }

    async handleFile(file) {
        this.hideError();
        
        const validExtensions = ['.drawio', '.xml'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!validExtensions.includes(fileExtension)) {
            this.showError('请选择 .drawio 或 .xml 格式的文件');
            return;
        }

        this.currentFile = file;
        this.fileName.textContent = `已选择: ${file.name}`;
        this.fileInfo.classList.add('show');

        try {
            this.showLoading();
            const content = await this.readFile(file);
            this.currentXml = content;
            this.renderDrawio(content);
            this.enableButtons();
        } catch (error) {
            this.hideLoading();
            this.showError(`读取文件失败: ${error.message}`);
        }
    }

    createNewDiagram() {
        this.hideError();
        this.currentFile = null;
        this.fileName.textContent = '新建图表';
        this.fileInfo.classList.add('show');
        
        const emptyXml = `<mxfile host="app.diagrams.net" modified="2024-01-01T00:00:00.000Z" agent="Draw.io Viewer" version="1.0">
  <diagram name="第 1 页" id="page1">
    <mxGraphModel dx="1000" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
        
        this.currentXml = emptyXml;
        this.showLoading();
        this.renderDrawio(emptyXml);
        this.enableButtons();
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('文件读取错误'));
            reader.readAsText(file);
        });
    }

    renderDrawio(xmlContent) {
        const frameUrl = `${this.drawioUrl}?embed=1&ui=min&proto=json&spin=1&noSaveBtn=1&noExitBtn=1&saveAndExit=0`;
        
        this.drawioFrame.src = frameUrl;
        this.drawioFrame.style.display = 'block';
        this.placeholder.style.display = 'none';
        
        this.pendingXml = xmlContent;
    }

    handleFrameMessage(e) {
        console.log('Received message:', e.origin, e.data);
        
        if (e.origin !== 'https://embed.diagrams.net' && e.origin !== 'https://viewer.diagrams.net') {
            return;
        }

        let msg;
        try {
            msg = JSON.parse(e.data);
        } catch (err) {
            return;
        }
        
        console.log('Parsed message:', msg);
        
        if (msg.event === 'init') {
            this.hideLoading();
            this.zoomControls.style.display = 'flex';
            
            if (this.pendingXml) {
                this.drawioFrame.contentWindow.postMessage(JSON.stringify({
                    action: 'load',
                    xml: this.pendingXml
                }), '*');
                this.pendingXml = null;
            }
        } else if (msg.event === 'load') {
            console.log('Diagram loaded successfully');
        } else if (msg.event === 'export') {
            console.log('Export response:', msg);
            let xml = msg.xml || msg.data;
            if (msg.data && typeof msg.data === 'string' && msg.data.includes('<mxfile')) {
                xml = msg.data;
            }
            console.log('Export response, xml:', xml ? 'received' : 'empty');
            if (xml) {
                this.currentXml = xml;
                if (this.pendingAction === 'preview') {
                    this._showXmlModalContent();
                } else if (this.pendingAction === 'download') {
                    this._downloadFileContent();
                }
                this.pendingAction = null;
            }
        } else if (msg.event === 'save') {
            const xml = msg.xml;
            console.log('Save response, xml:', xml ? 'received' : 'empty');
            if (xml) {
                this.currentXml = xml;
                if (this.pendingAction === 'preview') {
                    this._showXmlModalContent();
                } else if (this.pendingAction === 'download') {
                    this._downloadFileContent();
                }
                this.pendingAction = null;
            }
        }
    }

    showLoading() {
        this.loading.classList.add('show');
    }

    hideLoading() {
        this.loading.classList.remove('show');
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.classList.add('show');
    }

    hideError() {
        this.errorMessage.classList.remove('show');
    }

    enableButtons() {
        this.downloadBtn.disabled = false;
        this.previewBtn.disabled = false;
    }

    showXmlModal() {
        console.log('showXmlModal called, pendingAction set to preview');
        this.pendingAction = 'preview';
        this.exportDiagram();
    }

    _showXmlModalContent() {
        console.log('_showXmlModalContent called');
        if (!this.currentXml) return;
        const truncated = this.currentXml.length > 10000 
            ? this.currentXml.substring(0, 10000) + '\n\n... (内容已截断)' 
            : this.currentXml;
        this.xmlContent.textContent = truncated;
        this.xmlModal.classList.add('show');
    }

    hideXmlModal() {
        this.xmlModal.classList.remove('show');
    }

    downloadFile() {
        console.log('downloadFile called, pendingAction set to download');
        this.pendingAction = 'download';
        this.exportDiagram();
    }

    _downloadFileContent() {
        console.log('_downloadFileContent called');
        if (!this.currentXml) return;

        const blob = new Blob([this.currentXml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.currentFile ? this.currentFile.name : 'diagram.drawio';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    exportDiagram() {
        console.log('exportDiagram called, sending export action');
        this.drawioFrame.contentWindow.postMessage(JSON.stringify({
            action: 'export',
            format: 'xml'
        }), '*');
    }

    zoom(factor) {
        this.drawioFrame.contentWindow.postMessage(JSON.stringify({
            action: 'zoom',
            factor: factor
        }), '*');
    }

    zoomReset() {
        this.drawioFrame.contentWindow.postMessage(JSON.stringify({
            action: 'zoom',
            factor: 1
        }), '*');
    }

    showAiModal() {
        this.aiPrompt.value = '';
        
        this.aiModeSelection.style.display = 'block';
        
        const hasCurrentXml = !!this.currentXml;
        const newRadio = document.querySelector('input[name="aiMode"][value="new"]');
        const optimizeRadio = document.querySelector('input[name="aiMode"][value="optimize"]');
        
        if (hasCurrentXml) {
            optimizeRadio.disabled = false;
            optimizeRadio.checked = true;
            this.updatePromptLabel('optimize');
        } else {
            optimizeRadio.disabled = true;
            newRadio.checked = true;
            this.updatePromptLabel('new');
        }
        
        this.aiModal.classList.add('show');
    }

    hideAiModal() {
        this.aiModal.classList.remove('show');
    }

    handleModeChange(e) {
        this.updatePromptLabel(e.target.value);
    }

    updatePromptLabel(mode) {
        if (mode === 'optimize') {
            this.aiPromptLabel.textContent = '描述你想要的优化方向：';
            this.aiPrompt.placeholder = '例如：增加错误处理流程、优化布局、添加注释说明等';
        } else {
            this.aiPromptLabel.textContent = '描述你想要生成的图表：';
            this.aiPrompt.placeholder = '例如：生成一个用户登录流程图，包含输入用户名密码、验证、登录成功/失败等步骤';
        }
    }

    async generateWithAi() {
        const prompt = this.aiPrompt.value.trim();
        if (!prompt) {
            this.showError('请输入图表描述');
            return;
        }

        const mode = this.currentXml ? document.querySelector('input[name="aiMode"]:checked').value : 'new';
        
        this.hideAiModal();
        this.hideError();
        this.showLoading();

        try {
            const requestBody = {
                prompt: prompt
            };
            
            if (mode === 'optimize' && this.currentXml) {
                requestBody.current_xml = this.currentXml;
            }

            const response = await fetch(`${this.apiBaseUrl}/draw`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.xml_content) {
                this.currentXml = data.xml_content;
                this.currentFile = null;
                this.fileName.textContent = mode === 'optimize' ? 'AI优化的图表' : 'AI生成的图表';
                this.fileInfo.classList.add('show');
                
                if (this.drawioFrame.style.display === 'block') {
                    this.hideLoading();
                    this.drawioFrame.contentWindow.postMessage(JSON.stringify({
                        action: 'load',
                        xml: data.xml_content
                    }), '*');
                } else {
                    this.renderDrawio(data.xml_content);
                }
                
                this.enableButtons();
            } else {
                throw new Error(data.message || '生成失败');
            }
        } catch (error) {
            this.hideLoading();
            this.showError(`AI生成失败: ${error.message}`);
            console.error('AI generation error:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DrawioViewer();
});
