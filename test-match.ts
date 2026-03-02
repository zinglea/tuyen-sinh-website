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
        const res = await model.embedContent("điểm xét tuyển bằng bao nhiêu");
        console.log("Query vector length:", res.embedding.values.length);

        console.log("Matching...");
        const { data, error } = await supabase.rpc('match_documents', {
            query_embedding: res.embedding.values,
            match_threshold: 0.1, // Set lower threshold for testing
            match_count: 2
        });

        if (error) {
            console.error("Match error:", error);
        } else {
            console.log("Matches found:", data?.length || 0);
            if (data && data.length > 0) {
                data.forEach((d: any, i: number) => {
                    console.log(`\n--- Match ${i + 1} (Score: ${d.similarity}) ---`);
                    console.log(d.content.substring(0, 150) + "...");
                });
            }
        }
    } catch (e: any) {
        console.error("Fatal error:", e.message);
    }
    console.log("Done test-match.");
}
run();
