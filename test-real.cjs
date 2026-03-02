const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config({ path: '.env.local' });

async function run() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const res = await model.embedContent('hello');
        console.log("Success");
    } catch (e) {
        fs.writeFileSync('err.txt', e.toString());
        console.log("Error saved to err.txt");
    }
}
run();
