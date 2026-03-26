const VALID_EXTENSIONS = ['.drawio', '.xml'];

class FileService {
    validateFile(file) {
        if (!file) {
            return { valid: false, error: '未选择文件' };
        }

        const extension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!VALID_EXTENSIONS.includes(extension)) {
            return { 
                valid: false, 
                error: `不支持的文件格式，请选择 ${VALID_EXTENSIONS.join(' 或 ')} 文件` 
            };
        }

        return { valid: true, error: null };
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('文件读取失败'));
            
            reader.readAsText(file);
        });
    }

    download(content, filename) {
        const blob = new Blob([content], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    createEmptyDiagram() {
        return `<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="Draw.io Viewer" version="1.0">
  <diagram name="第 1 页" id="page1">
    <mxGraphModel dx="1000" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
    }
}

export default new FileService();
