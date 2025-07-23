// data-pipeline/collectors/clinicalTrialsCollector.js
const axios = require('axios');

async function fetchClinicalTrials() {
  const apiUrl = 'https://classic.clinicaltrials.gov/api/v2/studies?format=json';
  
  try {
    console.log(`Downloading trial data as JSON from ${apiUrl}...`);

    // Axios will fetch the URL and automatically parse the JSON response
    const response = await axios.get(apiUrl, {
      responseType: 'json'
    });

    console.log('Download and JSON parsing complete.');

    // The actual trial data is in the 'studies' array of the response object
    const trials = response.data.studies;

    if (!trials || !Array.isArray(trials)) {
      throw new Error("The API response did not contain a 'studies' array.");
    }
    
    console.log(`Loaded ${trials.length} trials from the API.`);
    
    return trials;

  } catch (error) {
    // Log helpful details if an error occurs
    if (error.response) {
      console.error('Error fetching clinical trials: Received status code', error.response.status);
    } else {
      console.error('Error fetching clinical trials:', error.message);
    }
    throw error;
  }
}

module.exports = { fetchClinicalTrials };