const fs = require('fs');
const https = require('https');
const path = require('path');

// Reliable direct link to Static Cairo Regular from google/fonts repo via jsDelivr
const fontUrl = "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/static/Amiri-Regular.ttf";
const outputPath = path.join(__dirname, 'lib', 'cairo-font.ts');

async function downloadAndEmbed() {
    console.log(`Downloading font from: ${fontUrl}`);

    const download = (url) => new Promise((resolve, reject) => {
        const options = {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        };
        https.get(url, options, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return download(res.headers.location).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`Failed to download: ${res.statusCode}`));
            }
            const data = [];
            res.on('data', (chunk) => data.push(chunk));
            res.on('end', () => resolve(Buffer.concat(data)));
        }).on('error', reject);
    });

    try {
        const buffer = await download(fontUrl);
        const base64 = buffer.toString('base64');

        console.log(`Downloaded ${buffer.length} bytes.`);

        if (base64.startsWith("PCFET0")) { // "<!DOCTYPE"
            throw new Error("Downloaded content is HTML, not a TTF file.");
        }

        const fileContent = `export const cairoFontBase64 = "${base64}";\n`;
        fs.writeFileSync(outputPath, fileContent);
        console.log(`Successfully updated ${outputPath}`);

        // Also save to public/fonts just in case
        const publicDir = path.join(__dirname, 'public', 'fonts');
        if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
        fs.writeFileSync(path.join(publicDir, 'Cairo-Regular.ttf'), buffer);
        console.log(`Updated public/fonts/Cairo-Regular.ttf`);

    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

downloadAndEmbed();
