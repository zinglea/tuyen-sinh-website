import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    console.log("Starting test-match...");
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        console.log("Supabase URL:", supabaseUrl.substring(0, 15) + '...');
        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log("Embedding query...");
        const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
        const res = await model.embedContent("phân biệt điểm khác nhau giữa quy định về bài thi bộ công an năm 2024 và 2025");
        console.log("Query vector length:", res.embedding.values.length);

        console.log("Matching...");
        const { data, error } = await supabase.rpc('match_documents', {
            query_embedding: res.embedding.values,
            match_threshold: 0.1, // Set lower threshold for testing
            match_count: 10
        });

        if (error) {
            console.error("Match error:", error);
        } else {
            console.log("Matches found:", data?.length || 0);
            if (data && data.length > 0) {
                const fs = require('fs');
                const output = data.map((d: any, i: number) => ({
                    rank: i + 1,
                    score: d.similarity,
                    source: d.metadata.source,
                    content: d.content.substring(0, 50).replace(/\n/g, " ")
                }));
                fs.writeFileSync('matches.json', JSON.stringify(output, null, 2));
                console.log("Wrote matches to matches.json");
            }
        }
    } catch (e: any) {
        console.error("Fatal error:", e.message);
    }
    console.log("Done test-match.");
}
run();
