class Batter {
    constructor() {

    }

    setDiv(div, func) {

        this.input = {
            'ba': div.getElementsByClassName('input_ratio_ba')[0],
            'out': div.getElementsByClassName('input_ratio_out')[0],

            'gb': div.getElementsByClassName('input_ratio_gb')[0],
            'fb': div.getElementsByClassName('input_ratio_fb')[0],

            'dh': div.getElementsByClassName('input_ratio_dh')[0],
            'th': div.getElementsByClassName('input_ratio_th')[0],
            'hr': div.getElementsByClassName('input_ratio_hr')[0],
        }

        this.derived = {
            'so': div.getElementsByClassName('input_ratio_so')[0],
            'sh': div.getElementsByClassName('input_ratio_sh')[0],
        }

        this.sac = div.getElementsByClassName(
            'input_ratio_sacrifice')[0];

        for (let key in this.input) {
            input[key].addEventListner('change', () => {
                func();
            });
        }
        
        this.sac.addEventListner('change', () => {
            func();
        });

    }

    getAbility() {

        const batter_ability = {};

        for (let key in this.input) {
            batter_ability_raw[key] = parseFloat(
                this.input[key].value)
        }

        batter_ability['bb']
            = 1 - (batter_ability['ba'] + batter_ability['out']);

        batter_ability['sh']
            = batter_ability['ba'] - (batter_ability['dh']
                + batter_ability['th'] + batter_ability['hr']);

        batter_ability['so'] = batter_ability['out'] - 
            (batter_ability['gb'] + batter_ability['fb']);

        this.derived['bb'].value = batter_ability['bb'];
        this.derived['sh'].value = batter_ability['sh'];
        this.derived['so'].value = batter_ability['so'];
        

        return batter_ability;
        
    }
}

export { Batter }