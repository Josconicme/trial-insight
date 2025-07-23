require('dotenv').config();
const mongoose = require('mongoose');
const Trial = require('./backend/models/Trial');
const { generateTrialSummary } = require('./ai-models/nlp/trialQueryProcessor');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function generateAndStoreSummaries() {
    console.log('--- Starting Summary Generation Script ---');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Successfully connected to MongoDB.');

    // Find trials that do not have a summary yet
    const trialsToProcess = await Trial.find({ 
        $or: [ { summary: null }, { summary: '' } ] 
    });

    if (trialsToProcess.length === 0) {
        console.log('No trials found that need summaries. All done!');
        await mongoose.disconnect();
        return;
    }

    console.log(`Found ${trialsToProcess.length} trials to process.`);

    for (const trial of trialsToProcess) {
        try {
            console.log(`Processing summary for trial: ${trial.nctId}...`);
            const summary = await generateTrialSummary(trial);

            // Exclude the fallback message
            if (summary && !summary.includes("could not be generated")) {
                trial.summary = summary;
                await trial.save();
                console.log(`  -> Successfully saved summary for ${trial.nctId}`);
            } else {
                console.warn(`  -> Failed to generate a valid summary for ${trial.nctId}.`);
            }

            await delay(1000); // Wait 1 second to respect API quotas

        } catch (error) {
            console.error(`  -> An error occurred while processing ${trial.nctId}:`, error);
        }
    }

    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
    console.log('--- Summary Generation Completed ---');
}

generateAndStoreSummaries().catch(console.error);