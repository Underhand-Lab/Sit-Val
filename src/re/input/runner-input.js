class RunnerInput {
    constructor() {}

    setDiv(div, onUpdate) {
        // UI 클래스명은 기존 HTML 구조를 유지하며, 내부 키값만 1B 규칙으로 변경합니다.
        this.inputs = {
            // 1루타(1B) 시 주자 진루 상황
            's_r1_r2_safe': div.getElementsByClassName(
                'input_runner_s_r1_r2_safe')[0],
            's_r1_r2_out': div.getElementsByClassName(
                'input_runner_s_r1_r2_out')[0],
            'passedball': div.getElementsByClassName(
                'input_runner_passedball')[0],

            's_r2_r3_safe': div.getElementsByClassName(
                'input_runner_s_r2_r3_safe')[0],
            's_r2_r3_out': div.getElementsByClassName(
                'input_runner_s_r2_r3_out')[0],

            '1B_r2_home_safe':  div.getElementsByClassName(
                'input_runner_1B_r2_home_safe')[0],
            '1B_r2_home_out':   div.getElementsByClassName(
                'input_runner_1B_r2_home_out')[0],

            '2B_r1_home_safe':  div.getElementsByClassName(
                'input_runner_2B_r1_home_safe')[0],
            '2B_r1_home_out':   div.getElementsByClassName(
                'input_runner_2B_r1_home_out')[0],

            '1B_r1_r3_safe':    div.getElementsByClassName(
                'input_runner_1B_r1_r3_safe')[0],
            '1B_r1_r3_out':    div.getElementsByClassName(
                'input_runner_1B_r1_r3_out')[0],

            // 뜬공(fo) 상황
            'fo_r3_home_safe':  div.getElementsByClassName(
                'input_runner_fo_r3_home_safe')[0],
            'fo_r3_home_out':   div.getElementsByClassName(
                'input_runner_fo_r3_home_out')[0],

            // 땅볼(go) 상황
            'go_r1_r2_out': div.getElementsByClassName(
                'input_runner_go_r1_r2_out')[0],
            'go_b_r1_out':  div.getElementsByClassName(
                'input_runner_go_b_r1_out')[0],
        };

        this.derivedElements = {
            's_r1_r1_safe':    div.getElementsByClassName('input_runner_s_r1_r1_safe')[0],
            's_r2_r2_safe':    div.getElementsByClassName('input_runner_s_r1_r1_safe')[0],
            '1B_r2_r3_safe':    div.getElementsByClassName('input_runner_1B_r2_r3_safe')[0],
            '2B_r1_r3_safe':    div.getElementsByClassName('input_runner_2B_r1_r3_safe')[0],
            '1B_r1_r2_safe':    div.getElementsByClassName('input_runner_1B_r1_r2_safe')[0],
            'fo_r3_r3_safe':    div.getElementsByClassName('input_runner_fo_r3_r3_safe')[0],
            'go_double_play':   div.getElementsByClassName('input_runner_go_double_play')[0],
        };

        for (let key in this.inputs) {
            this.inputs[key].addEventListener('change', () => onUpdate());
        }
    }

    _calculateRemaining(inputs, values, target, list) {
        let remaining = new Decimal(1);
        for (let v of list) {
            remaining = remaining.minus(values[v] || 0);
        }

        this.derivedElements[target].innerHTML = remaining.toString();
        values[target] = remaining;

        for (let x of list) {
            let limit = new Decimal(1);
            for (let y of list) {
                if (x === y) continue;
                limit = limit.minus(values[y] || 0);
            }
            inputs[x].max = limit.toString();
        }
    }

    getAbility() {
        const params = {};

        // 1. 기본 입력값 수집
        for (let key in this.inputs) {
            const val = new Decimal(Math.min(
                this.inputs[key].value || 0, 
                this.inputs[key].max || 1
            ));
            params[key] = val;
            this.inputs[key].value = val.toString();
        }
        
        this._calculateRemaining(this.inputs, params, 's_r1_r1_safe', ['s_r1_r2_safe', 's_r1_r2_out']);
        this._calculateRemaining(this.inputs, params, 's_r2_r2_safe', ['s_r2_r3_safe', 's_r2_r3_out']);
        
        // [뜬공] fo_r3_home_safe/out 제외 -> 3루 잔루(fo_r3_r3_safe)
        this._calculateRemaining(this.inputs, params, 'fo_r3_r3_safe', ['fo_r3_home_safe', 'fo_r3_home_out']);
        
        // [1루타] 2루 주자 홈/아웃 제외 -> 3루 진루(1B_r2_r3_safe)
        this._calculateRemaining(this.inputs, params, '1B_r2_r3_safe', ['1B_r2_home_safe', '1B_r2_home_out']);
        
        this._calculateRemaining(this.inputs, params, '2B_r1_r3_safe', ['2B_r1_home_safe', '2B_r1_home_out']);
        
        // [1루타] 1루 주자 3루 진루 제외 -> 2루 진루(1B_r1_r2_safe)
        this._calculateRemaining(this.inputs, params, '1B_r1_r2_safe', ['1B_r1_r3_safe', '1B_r1_r3_out']);
        
        // [땅볼] 야수선택 2종 제외 -> 병살타(go_double_play)
        this._calculateRemaining(this.inputs, params, 'go_double_play', ['go_r1_r2_out', 'go_b_r1_out']);

        // 3. 엔진 연산을 위해 숫자형으로 변환
        for (let key in params) {
            params[key] = parseFloat(params[key]);
        }
        
        return params;
    }
}

export { RunnerInput };