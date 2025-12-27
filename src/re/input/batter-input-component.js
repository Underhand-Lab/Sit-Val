import { loadFile } from "/src/easy-h/module/load-file.js"
import { downloadCSV, readCSV } from "/src/csv/download.js"

export class BatterInput extends HTMLElement {
    constructor() {
        super();
        this.binded = false;
        this.window = document.createElement('div');
    }

    setEvent(event) {
        this.onValueChanged = event;
    }

    updateUI() {
        
        const batterAbilityRaw = this.getAbilityRaw();

        const pa = batterAbilityRaw['pa'];
        const hit = batterAbilityRaw["1B"]
            + batterAbilityRaw["2B"]
            + batterAbilityRaw["3B"]
            + batterAbilityRaw["hr"];

        const ob = hit + batterAbilityRaw["bb"];

        const tb = batterAbilityRaw["1B"]
            + batterAbilityRaw["2B"] * 2
            + batterAbilityRaw["3B"] * 3
            + batterAbilityRaw["hr"] * 4;

        this.sac.max = Math.min(batterAbilityRaw["go"]);
        this.sf.max = Math.min(pa - ob, batterAbilityRaw["fo"]);

        this.sac.value = Math.min(this.sac.max, this.sac.value);
        this.sf.value = Math.min(this.sf.max, this.sf.value);

        const ab = pa - batterAbilityRaw["bb"]
            - parseInt(this.sac.value) - parseInt(this.sf.value);

        this.derived['pa'].innerHTML = pa;
        this.derived['ab'].innerHTML = ab;
        this.derived['hit'].innerHTML = hit;
        this.derived['ob'].innerHTML = ob;
        this.derived['tb'].innerHTML = tb;

        const oba = (ob / (pa - this.sac.value));
        const slg = (tb / ab);

        this.derived['ba'].innerHTML = (hit / ab).toFixed(3);
        this.derived['oba'].innerHTML = oba.toFixed(3);
        this.derived['slg'].innerHTML = slg.toFixed(3);
        this.derived['ops'].innerHTML = (oba + slg).toFixed(3);
    }

    valueChanged() {
        
        if (!this.binded) return;

        this.updateUI();

        if (!this.onValueChanged) return;
        this.onValueChanged();
    }

    static get observedAttributes() {
        return ['src', 'inner-class'];
    }

    setAfterBindInput(event) {
        if (this.binded) {
            event();
            return;
        }
        this.afterBindEvent = event;
    }

    connectedCallback() {
        this.appendChild(this.window);
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
        if (attrName == "src") {
            loadFile(newVal).then((html) => {
                this.window.innerHTML = html;

                // 2. 브라우저가 새로운 DOM 요소를 인지하고 렌더링 트리에 올릴 때까지 대기
                requestAnimationFrame(() => {
                    this.bindInput();
                    this.updateUI();
                    if (!this.afterBindEvent) return;
                    this.afterBindEvent();
                    this.afterBindEvent = null;
                });

            }).catch(error => {
                console.error(error);
                this.insertAdjacentHTML('beforeend', `<p style="color:red;">로딩 실패</p>`);
            });
            return;
        }
        if (attrName == "inner-class") {
            this.window.className = newVal;

        }
    }
    
    bindInput() {

        this.input = {
            'bb': this.getElementsByClassName('input-batter-bb')[0],

            'so': this.getElementsByClassName('input-batter-so')[0],
            'go': this.getElementsByClassName('input-batter-go')[0],
            'fo': this.getElementsByClassName('input-batter-fo')[0],

            '1B': this.getElementsByClassName('input-batter-1B')[0],
            '2B': this.getElementsByClassName('input-batter-2B')[0],
            '3B': this.getElementsByClassName('input-batter-3B')[0],
            'hr': this.getElementsByClassName('input-batter-hr')[0],
        }

        this.derived = {
            'pa': this.getElementsByClassName('input-batter-pa')[0],
            'ab': this.getElementsByClassName('input-batter-ab')[0],
            'hit': this.getElementsByClassName('input-batter-hit')[0],
            'ob': this.getElementsByClassName('input-batter-ob')[0],
            'tb': this.getElementsByClassName('input-batter-tb')[0],
            'ba': this.getElementsByClassName('input-batter-ba')[0],
            'oba': this.getElementsByClassName('input-batter-oba')[0],
            'slg': this.getElementsByClassName('input-batter-slg')[0],
            'ops': this.getElementsByClassName('input-batter-ops')[0],
        }

        this.sf = this.getElementsByClassName(
            'input-batter-sf')[0];
        this.sac = this.getElementsByClassName(
            'input-batter-sac')[0];

        for (let key in this.input) {
            (this.input[key]).addEventListener('change', () => {
                if (this.load) return;
                this.valueChanged();
            });
        }

        this.sf.addEventListener('change', () => {
            if (this.load) return;
            this.valueChanged();
        });

        this.sac.addEventListener('change', () => {
            if (this.load) return;
            this.valueChanged();
        });

        this.nameInput = this.getElementsByClassName('player-name')[0];

        if (this.nameInput) {
            this.nameInput.addEventListener('change', () => {
                this.setName(this.nameInput.value);
                if (this.load) return;
                this.valueChanged();
            });
        }

        const saveBtn = this.getElementsByClassName('save-csv')[0];
        const readBtnFile = this.getElementsByClassName('read-csv-file')[0];
        const readBtn = this.getElementsByClassName('read-csv')[0];

        saveBtn?.addEventListener('click', () => {
            downloadCSV([this.getAbilityRaw()], this.getName());
        });

        readBtn?.addEventListener('click', () => {
            readBtnFile.click();
        })
        readBtnFile?.addEventListener('change', () => {
            readBtnFile.files[0].text().then((csv) => {
                this.readJson(readCSV(csv)[0]);
                readBtnFile.value = "";
                this.valueChanged();
            });
        });
        this.binded = true;
        this.getAbility();
    }

    setName(name) {
        this.name = name;
    }

    getName() {
        return this.name
    }

    getAbilityRaw() {
        if (!this.binded) return;

        let batterAbilityRaw = {};
        batterAbilityRaw['name'] = this.getName();

        let pa = 0;

        for (let key in this.input) {
            batterAbilityRaw[key] = parseInt(
                this.input[key].value);
            pa += batterAbilityRaw[key];
        }

        batterAbilityRaw['pa'] = pa;
        batterAbilityRaw['sf'] = parseInt(this.sf.value);
        batterAbilityRaw['sac'] = parseInt(this.sac.value);

        return batterAbilityRaw;

    }

    readJson(json) {
        this.load = true;
        for (let key in json) {
            if (key in this.input) {
                this.input[key].value = json[key];
            }
        }
        this.sac.value = 'sac' in json ? json['sac'] : 0;
        this.sf.value = 'sf' in json ? json['sf'] : 0;
        if (this.nameInput) {
            this.name = json['name'];
            this.nameInput.value = json['name'];
            this.nameInput.dispatchEvent(new Event('change'));
        }
        else {
            this.name = json['name'];
        }
        this.updateUI();
        this.load = false;
    }
    
    static convertToRatio(batterAbilityRaw) {

        const pa = new Decimal(batterAbilityRaw['pa']);

        const batter_ability = {
            'bb': new Decimal(batterAbilityRaw["bb"]).div(pa),

            'so': new Decimal(batterAbilityRaw["so"]).div(pa),
            'go': new Decimal(batterAbilityRaw["go"]).div(pa),
            'fo': new Decimal(batterAbilityRaw["fo"]).div(pa),

            '1B': new Decimal(batterAbilityRaw["1B"]).div(pa),
            '2B': new Decimal(batterAbilityRaw["2B"]).div(pa),
            '3B': new Decimal(batterAbilityRaw["3B"]).div(pa),
            'hr': new Decimal(batterAbilityRaw["hr"]).div(pa),
        }


        for (let key in batter_ability) {
            batter_ability[key] = parseFloat(batter_ability[key]);
        }
        return batter_ability;
    }

    getAbility() {

        if (!this.binded) return;

        return BatterInput.convertToRatio(this.getAbilityRaw());

    }

}

customElements.define('batter-input', BatterInput);