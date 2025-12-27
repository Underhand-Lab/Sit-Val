class PopUp extends HTMLElement {
    constructor() {
        super();
    }

    static get observedAttributes() {
        return ['window-class'];
    }

    connectedCallback() {
        this.window = document.createElement('div');

        this.window.innerHTML = this.innerHTML;
        this.innerHTML = '';
        this.appendChild(this.window);

        if (this.windowClassName) {
            this.window.className = this.windowClassName;
        }

        const closeBtn = this.
            getElementsByClassName('close-btn')[0];
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.close();
            });
        }
    }

    open() {
        this.style = "display:block;"
    }

    close() {
        this.style = "display:none;"
    }

    disconnectedCallback() {
        console.log("ImportHTML");

    }

    attributeChangedCallback(attrName, oldVal, newVal) {
        if (attrName == "window-class") {
            this.windowClassName = newVal;
            if (!this.window) return;
            this.window.className = newVal;
            return;
        }
    }

}

customElements.define('pop-up', PopUp);