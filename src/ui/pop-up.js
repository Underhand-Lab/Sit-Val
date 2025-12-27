class PopUp {

    constructor(targetElement, openBtn) {
        this.target = targetElement;

        const closeBtn = targetElement.
            getElementsByClassName('close-btn')[0];

        if (openBtn) {
            openBtn.addEventListener('click', () => {
                this.open();
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.close();
            });
        }
        
    }

    open() {
        this.target.dataset.state = "open";
    }

    close() {
        this.target.dataset.state = "close";
    }

    addCloseEvent(event) {
        
        const closeBtn = this.target.
            getElementsByClassName('close-btn')[0];
        if (closeBtn) {
            closeBtn.addEventListener('click', event);
        }
    }


}

export { PopUp }