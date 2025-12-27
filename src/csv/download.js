export async function downloadCSV(json, filename) {
    if (!json || json.length === 0) return;

    const headers = Object.keys(json[0]);
    const csvRows = json.map(row => 
        headers.map(header => {
            const value = row[header];
            
            // 1. null/undefined 처리
            if (value === null || value === undefined) return "";

            // 2. 숫자(Number) 타입인 경우 그대로 반환 (따옴표 X)
            if (typeof value === 'number') return value;

            // 3. 문자열 처리
            let stringValue = String(value);
            
            // 값에 쉼표(,), 큰따옴표("), 또는 줄바꿈(\n)이 포함된 경우에만 큰따옴표로 감쌈
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            
            // 일반 문자열은 따옴표 없이 반환
            return stringValue;
        }).join(',')
    );

    const csvContent = [headers.join(','), ...csvRows].join('\r\n');

    try {
        const handle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{
                description: 'CSV File',
                accept: { 'text/csv': ['.csv'] },
            }],
        });

        const writable = await handle.createWritable();
        // UTF-8 BOM 추가 (엑셀 인식용)
        await writable.write("\ufeff" + csvContent);
        await writable.close();

        console.log("파일이 성공적으로 저장되었습니다.");
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error("저장 오류:", err);
        }
    }
}

export function readCSV(csv) {
    // \r\n (Windows), \n (Unix), \r (Old Mac) 모두를 대응하는 정규표현식입니다.
    var lines = csv.split(/\r?\n|\r/);

    var result = [];
    var headers = lines[0].split(",");

    for (var i = 1; i < lines.length; i++) {
        // 공백만 있는 줄이나 빈 줄은 건너뜁니다.
        if (!lines[i].trim()) continue;

        var obj = {};
        var currentline = lines[i].split(",");

        for (var j = 0; j < headers.length; j++) {
            var value = currentline[j] ? currentline[j].trim() : "";
            obj[headers[j].trim()] = value;
        }

        result.push(obj);
    }

    return result;
}