const fs = require('fs');
const data = JSON.parse(fs.readFileSync('e:/files/tuyen-sinh-website/tuyen-sinh-website/data/rag/processed/doc_TT131 quy dinh suc khoe 2025.json', 'utf8'));

const text = data.content;
let output = "";

output += "ALL INSTANCES OF 1m58:\n";
const regex = /.{0,200}1m58.{0,200}/g;
let match;
while ((match = regex.exec(text)) !== null) {
    output += "-----------------------------------------------------\n";
    output += match[0] + "\n";
}

output += "\nALL INSTANCES OF 1m56:\n";
const regex2 = /.{0,200}1m56.{0,200}/g;
let match2;
while ((match2 = regex2.exec(text)) !== null) {
    output += "-----------------------------------------------------\n";
    output += match2[0] + "\n";
}

fs.writeFileSync('e:/files/tuyen-sinh-website/tuyen-sinh-website/tmp_output_utf8.txt', output, 'utf8');
