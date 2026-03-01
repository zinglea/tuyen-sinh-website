// Test video extraction from docx
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'news', '05.docx');
const buffer = fs.readFileSync(filePath);
const bufStr = buffer.toString('binary');

console.log('File size:', buffer.length, 'bytes');
console.log('');

// Search for video URLs in the binary content
const patterns = [
    { name: 'YouTube embed', regex: /https?:\/\/(?:www\.)?youtube\.com\/(?:embed\/|watch\?v=|v\/)([\w-]+)[^\s"<']*/g },
    { name: 'YouTube short', regex: /https?:\/\/youtu\.be\/([\w-]+)[^\s"<']*/g },
    { name: 'Facebook video', regex: /https?:\/\/(?:www\.)?facebook\.com\/.*\/videos\/\d+[^\s"<']*/g },
    { name: 'MP4', regex: /https?:\/\/[^\s"<']*\.mp4[^\s"<']*/g },
];

let foundAny = false;
for (const p of patterns) {
    let match;
    while ((match = p.regex.exec(bufStr)) !== null) {
        const url = match[0].replace(/[^\x20-\x7E]/g, '');
        console.log(`✅ Found ${p.name}: ${url}`);
        foundAny = true;
    }
}

if (!foundAny) {
    console.log('❌ No video URLs found in binary content');

    // Try to find any http URLs
    const httpRegex = /https?:\/\/[^\s"<']{10,}/g;
    let httpMatch;
    console.log('\nAll HTTP URLs found:');
    while ((httpMatch = httpRegex.exec(bufStr)) !== null) {
        const url = httpMatch[0].replace(/[^\x20-\x7E]/g, '');
        if (url.length < 200) console.log(' -', url);
    }
}

// Also check the rels file directly
console.log('\n--- Checking document.xml.rels in zip ---');
const relsMarker = 'document.xml.rels';
const idx = bufStr.indexOf(relsMarker);
console.log('Found rels marker at index:', idx);

// Look for hyperlink relationships
const hlIdx = bufStr.indexOf('hyperlink');
console.log('Found "hyperlink" at index:', hlIdx);
if (hlIdx > 0) {
    // Extract surrounding context
    const start = Math.max(0, hlIdx - 50);
    const end = Math.min(bufStr.length, hlIdx + 200);
    const context = bufStr.substring(start, end).replace(/[^\x20-\x7E]/g, '');
    console.log('Context around hyperlink:', context);
}
