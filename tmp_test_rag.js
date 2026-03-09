const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testRAG() {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const question = "1m58 nam thi công an được không";

    console.log(`Embedding question: "${question}"`);
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const embedResult = await embeddingModel.embedContent(question);
    const queryVector = embedResult.embedding.values;

    console.log(`Querying Supabase...`);
    const { data: matchedDocs, error } = await supabase.rpc('match_documents', {
        query_embedding: queryVector,
        match_threshold: 0.5,
        match_count: 25
    });

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Found ${matchedDocs.length} chunks.`);
    let found1m58 = false;
    matchedDocs.forEach((doc, i) => {
        if (doc.content.includes('1m58')) {
            console.log(`\n--- Chunk ${i + 1} contains '1m58' ---`);
            console.log(doc.content.substring(0, 300) + '...');
            found1m58 = true;
        }
    });

    if (!found1m58) {
        console.log("None of the retrieved chunks contain '1m58'!");
    } else {
        console.log("Chunk with 1m58 was retrieved successfully.");
    }
}

testRAG();
