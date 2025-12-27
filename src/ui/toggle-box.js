class ToggleBox {

    constructor(targetElement, openBtn, toggled) {

        this.target = targetElement;
        this.toggled = toggled;

        const closeBtn = targetElement.
            getElementsByClassName('close-btn')[0];
        const toggleBtn = targetElement.
            getElementsByClassName('toggle-btn')[0];

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

        if (toggleBtn) {
            toggleBtn.innerHTML = this.toggled ? '⧉' : '⛶';
            toggleBtn.addEventListener('click', () => {

                if (this.toggled) {
                    this.toggled = false;
                    this.target.dataset.state = "min";
                    toggleBtn.innerHTML = '⛶';
                    return;
                }
                this.toggled = true;
                this.target.dataset.state = "max";
                toggleBtn.innerHTML = '⧉';

            });
        }


    }

    open() {
        this.target.dataset.state = this.toggled ? "max" : "min";
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

export { ToggleBox }