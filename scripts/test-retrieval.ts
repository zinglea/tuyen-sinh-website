import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function testRetrieval() {
    const currentYear = 2026;
    const message = "công thức tính điểm thi THPT phương thức 3";
    const optimizedQuery = `[Năm ${currentYear}] ${message}`;

    console.log(`Querying for: "${optimizedQuery}"`);

    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const embedResult = await embeddingModel.embedContent(optimizedQuery);
    const queryVector = embedResult.embedding.values;

    const { data: matchedDocs, error: matchError } = await supabase.rpc('match_documents', {
        query_embedding: queryVector,
        match_threshold: 0.3, // Lowered threshold to see what's being matched
        match_count: 5       // Just looking at top 5 chunks
    });

    if (matchError) {
        console.error("Match error:", matchError);
        return;
    }

    console.log(`Found ${matchedDocs?.length || 0} chunks.\n`);

    if (matchedDocs) {
        import('fs').then(fs => {
            fs.writeFileSync('test-output.json', JSON.stringify(matchedDocs, null, 2));
            console.log('Wrote results to test-output.json');
        });
    }
}

testRetrieval();
