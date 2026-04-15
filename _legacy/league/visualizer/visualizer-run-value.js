export class VisualizerRunValue {

    constructor() {

    }

    bindElement(element) {
        this.element = element;
    }

    setREValue(ret, weights, lgWobaRaw, wOBAScale, runPerPa) {
        
        if (!this.element) return;
        this.element.querySelector('.run-value').innerHTML =
            this.visualizeRunValue(ret['runValue']);

    }

    visualizeRunValue(dataList) {
        if (!dataList) {
            return "";
        }

        // 1. 객체를 배열로 변환
        const sortedItems = Object.keys(dataList).map(key => ({
            label: key,
            ...dataList[key]
        }));

        const label = {
            "hr": '<e-text key="label-hr">홈런</e-text>',
            "3B": '<e-text key="label-3b">3루타</e-text>',
            "2B": '<e-text key="label-2b">2루타</e-text>',
            "1B": '<e-text key="label-1b">단타</e-text>',
            "bb": '<e-text key="label-bb">볼넷</e-text>',
            "so": '<e-text key="label-so">삼진 아웃</e-text>',
            "go": '<e-text key="label-go">땅볼 아웃</e-text>',
            "fo": '<e-text key="label-fo">뜬공 아웃</e-text>',
        }

        // 2. value 기준 내림차순 정렬 (b.value - a.value)
        sortedItems.sort((a, b) => b.value - a.value);

        let html = `
                <table class="re-table">
                    <thead>
                        <tr>
                            <th>
                                <e-text key="label-batted-ball">
                                    타구
                                </e-text>
                            </th>
                            <th>
                                <e-text key="label-value">
                                    가치
                                </e-text>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
            `;

        // 3. 정렬된 배열(sortedItems)로 HTML 생성
        for (const item of sortedItems) {
            html += `
                        <tr>
                            <td class="runner-state">${label[item.name]}</td>
                            <td>${item.value.toFixed(3)}</td>
                        </tr>
                    `;
        }

        html += `
                    </tbody>
                </table>
            `;

        return html;
    }

}