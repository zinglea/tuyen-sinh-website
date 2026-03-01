// Extract knowledge from RAG processed JSONs → knowledge.txt
const fs = require('fs');
const path = require('path');

const PROCESSED_DIR = path.join(__dirname, '..', 'data', 'rag', 'processed');
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'rag', 'knowledge.txt');

const files = fs.readdirSync(PROCESSED_DIR).filter(f => f.endsWith('.json'));

// Deduplicate: group by original filename, take newest
const docMap = new Map();
for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(PROCESSED_DIR, file), 'utf-8'));
    const docFilename = data.filename;
    const match = file.match(/_(\d+)\.json$/);
    const timestamp = match ? parseInt(match[1]) : 0;
    const existing = docMap.get(docFilename);
    if (!existing || timestamp > existing.timestamp) {
        docMap.set(docFilename, { path: path.join(PROCESSED_DIR, file), timestamp });
    }
}

console.log(`Found ${docMap.size} unique docs (from ${files.length} files)`);

let fullContent = '';
for (const [filename, doc] of docMap) {
    const data = JSON.parse(fs.readFileSync(doc.path, 'utf-8'));
    let content = '';
    if (data.chunks && Array.isArray(data.chunks)) {
        content = data.chunks.map(c => c.content).join('\n');
    } else if (data.content) {
        content = data.content;
    }
    content = content.replace(/\n{3,}/g, '\n\n').trim();
    fullContent += `=== ${filename} ===\n\n${content}\n\n`;
    console.log(`  ${filename}: ${content.length} chars`);
}

fs.writeFileSync(OUTPUT_FILE, fullContent, 'utf-8');
console.log(`\nOutput: ${OUTPUT_FILE} (${Math.round(fullContent.length / 1024)}KB)`);
