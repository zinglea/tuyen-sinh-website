import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const res = await model.embedContent("Hello world test");
        console.log("Success:", res.embedding.values.slice(0, 5));
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}
run();
