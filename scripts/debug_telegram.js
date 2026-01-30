const https = require('https');

const token = "7676519642:AAF7b5eQ2uLetdRDGkwsM3flXKdrhzQNF0Q";
const chatId = "-1003808255475";

console.log("Testing Telegram Bot Connection...");

// 1. Check Token (getMe)
const url = `https://api.telegram.org/bot${token}/getMe`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log("getMe response:", data);

        try {
            const json = JSON.parse(data);
            if (json.ok) {
                console.log("Token is VALID. Bot:", json.result.username);
                verifyChatAccess();
            } else {
                console.error("Token is INVALID.");
            }
        } catch (e) { console.error("Parse Error:", e); }
    });
}).on("error", (err) => {
    console.log("Network Error: " + err.message);
});

function verifyChatAccess() {
    console.log("Testing Chat Access...");
    const postData = JSON.stringify({
        chat_id: chatId,
        text: "Debug message: System check."
    });

    const options = {
        hostname: 'api.telegram.org',
        path: `/bot${token}/sendMessage`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
        }
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log("sendMessage response:", data);
        });
    });

    req.on('error', (e) => {
        console.error("sendMessage Error:", e);
    });

    req.write(postData);
    req.end();
}
