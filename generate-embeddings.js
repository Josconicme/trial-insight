// generate-embeddings.js
// A one-time script to find trials without embeddings, generate them, and save them back to the database.
require('dotenv').config();
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const mongoose = require('mongoose');
const Trial = require('./backend/models/Trial');
const embeddingGenerator = require('./ai-models/embeddings/embeddingGenerator');

/**
 * Creates a rich text blob for a given trial to generate a high-quality embedding.
 * @param {object} trial - The trial document from MongoDB.
 * @returns {string} A combined string of important trial information.
 */
function createTextForEmbedding(trial) {
    return [
        `Title: ${trial.title || ''}`,
        `Official Title: ${trial.officialTitle || ''}`,
        `Status: ${trial.status || ''}`,
        `Conditions: ${(trial.conditions || []).join(', ')}`,
        `Interventions: ${(trial.interventions || []).map(i => i.name).join(', ')}`,
        `Summary: ${trial.eligibility?.criteria?.substring(0, 1000) || ''}` // Use a good chunk of the eligibility criteria
    ].filter(Boolean).join('; ').trim();
}

/**
 * Main function to connect to the DB, process trials, and store embeddings.
 */
async function generateAndStoreEmbeddings() {
    console.log('--- Starting Embedding Generation Script ---');
    // ... (rest of the function setup) ...
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Successfully connected to MongoDB.');

    // We will process documents that have a null or empty embedding array
    const trialsToProcess = await Trial.find({ embedding: { $in: [null, []] } });

    if (trialsToProcess.length === 0) {
        console.log('No trials found that need embeddings. All done!');
        await mongoose.disconnect();
        return;
    }

    console.log(`Found ${trialsToProcess.length} trials to process.`);

    for (const trial of trialsToProcess) {
        try {
            console.log(`Processing trial: ${trial.nctId}...`);
            const textToEmbed = createTextForEmbedding(trial);
            const vector = await embeddingGenerator.generateEmbeddings(textToEmbed);
            
            if (vector && vector.length > 0) {
                trial.embedding = vector;
                await trial.save();
                console.log(`  -> Successfully saved embedding for ${trial.nctId}`);
            } else {
                console.warn(`  -> Failed to generate a valid embedding for ${trial.nctId}. Skipping.`);
            }

            // --- THIS IS THE NEW LINE ---
            await delay(1000); // Wait for 1 second before the next API call
            // --------------------------

        } catch (error) {
            console.error(`  -> An error occurred while processing ${trial.nctId}:`, error);
        }
    }
    // ... rest of the function ...
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
    console.log('--- Embedding Generation Completed ---');
}

// Run the script and catch any top-level errors
generateAndStoreEmbeddings().catch(err => {
    console.error("A fatal error occurred during the script execution:", err);
    mongoose.disconnect();
});