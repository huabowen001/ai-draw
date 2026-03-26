class Modal {
    constructor(element) {
        this.element = element;
        this.closeButton = element.querySelector('.modal-close');
        this.bindEvents();
    }

    bindEvents() {
        this.closeButton?.addEventListener('click', () => this.hide());
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) this.hide();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                this.hide();
            }
        });
    }

    show() {
        this.element.classList.add('show');
        document.body.style.overflow = 'hidden';
        this.onShow?.();
    }

    hide() {
        this.element.classList.remove('show');
        document.body.style.overflow = '';
        this.onHide?.();
    }

    isVisible() {
        return this.element.classList.contains('show');
    }

    setContent(content) {
        const body = this.element.querySelector('.modal-body');
        if (body) body.innerHTML = content;
    }
}

export default Modal;
