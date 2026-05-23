export async function downloadCSV(json: Record<string, any>[], filename: string): Promise<void> {
    if (!json || json.length === 0) return;

    const headers = Object.keys(json[0]);
    const csvRows = json.map(row => 
        headers.map(header => {
            const value = row[header];
            
            // 1. null/undefined 처리
            if (value === null || value === undefined) return "";

            // 2. 숫자(Number) 타입인 경우 그대로 반환 (따옴표 X)
            if (typeof value === 'number') return value.toString();

            // 3. 문자열 처리
            const stringValue = String(value);
            
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
        const handle = await (window as any).showSaveFilePicker({
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
    } catch (err: any) {
        if (err.name !== 'AbortError') {
            console.error("저장 오류:", err);
        }
    }
}

export function readCSV(csv: string): Record<string, string>[] {
    // \r\n (Windows), \n (Unix), \r (Old Mac) 모두를 대응하는 정규표현식입니다.
    const lines = csv.split(/\r?\n|\r/);
    const result: Record<string, string>[] = [];
    if (lines.length === 0) return result;

    const headers = lines[0].split(",");

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const obj: Record<string, string> = {};
        const currentline = lines[i].split(",");

        for (let j = 0; j < headers.length; j++) {
            const value = currentline[j] ? currentline[j].trim() : "";
            obj[headers[j].trim()] = value;
        }
        result.push(obj);
    }

    return result;
}