// data-pipeline/index.js
const { fetchClinicalTrials } = require('./collectors/clinicalTrialsCollector');
const { processTrialData } = require('./processors/trialProcessor');
const { loadTrialsToMongoDB } = require('./loaders/mongoLoader');

async function runDataPipeline() {
  try {
    console.log('--- Starting Data Pipeline ---');

    // Step 1: Fetch clinical trials data
    console.log('\n[Step 1/3] Fetching clinical trials data...');
    const rawTrialData = await fetchClinicalTrials();
    console.log(`[Step 1/3] Fetched ${rawTrialData.length} clinical trials.`);

    // Step 2: Process the raw data
    console.log('\n[Step 2/3] Processing raw trial data into a structured format...');
    const processedTrials = await processTrialData(rawTrialData);
    console.log(`[Step 2/3] Processed ${processedTrials.length} trials successfully.`);

    // Step 3: Load processed data into MongoDB
    console.log('\n[Step 3/3] Loading processed data into MongoDB...');
    await loadTrialsToMongoDB(processedTrials);
    console.log('[Step 3/3] Data loaded into MongoDB successfully.');

    console.log('\n--- Data Pipeline Completed Successfully ---');
    process.exit(0);
  } catch (error) {
    console.error('\n--- A fatal error occurred in the data pipeline ---');
    console.error(error);
    process.exit(1);
  }
}

// Execute the pipeline
runDataPipeline();