const fetch = require('node-fetch') || fetch;

async function testApi() {
    try {
        const res = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'xin chao' })
        });
        console.log(res.status);
        if (!res.ok) {
            const text = await res.text();
            console.log(text);
        } else {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            while (!done) {
                const { value, done: isDone } = await reader.read();
                done = isDone;
                if (value) {
                    console.log(decoder.decode(value, { stream: true }));
                }
            }
        }
    } catch (e) {
        console.error(e);
    }
}
testApi();
