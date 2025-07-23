// data-pipeline/loaders/mongoLoader.js
require('dotenv').config(); // It will automatically 
const { MongoClient } = require('mongodb');

async function createIndexes(collection) {
    console.log('Creating MongoDB indexes...');
    
    // Index for fast lookups by NCT ID
    await collection.createIndex({ nctId: 1 }, { unique: true });
    
    // Text index for searching trial content
    await collection.createIndex({
        title: 'text',
        officialTitle: 'text',
        'conditions': 'text',
        'interventions.name': 'text',
        'eligibility.criteria': 'text',
        'keywords': 'text'
    }, { name: 'text_search_index' });
    
    // Indexes for common filters
    await collection.createIndex({ status: 1 });
    await collection.createIndex({ phase: 1 });
    await collection.createIndex({ conditions: 1 });
    await collection.createIndex({ 'sponsors.lead.name': 1 });
    await collection.createIndex({ startDate: 1 });
    await collection.createIndex({ completionDate: 1 });

    // Geospatial index for location-based queries
    // NOTE: This requires locations to be preprocessed into GeoJSON format.
    // The schema supports this, but the data pipeline doesn't do the geocoding yet.
    // The index will be created on the backend when connecting.
    await collection.createIndex({ "locations.coordinates": "2dsphere" });
    
    console.log('MongoDB indexes created successfully.');
}

async function loadTrialsToMongoDB(trials) {
  // Use environment variable from the backend's .env file
  const uri = process.env.MONGODB_URI;
  if (!uri) {
      throw new Error("MONGODB_URI not found in .env file. Make sure it's configured in backend/.env");
  }
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB.');

    const database = client.db('trialinsight');
    const trialsCollection = database.collection('trials');

    // First, drop the collection to start fresh
    console.log('Dropping existing "trials" collection...');
    try {
        await trialsCollection.drop();
        console.log('Collection dropped.');
    } catch (err) {
        if (err.codeName === 'NamespaceNotFound') {
            console.log('Collection did not exist, skipping drop.');
        } else {
            throw err;
        }
    }
    
    // Create necessary indexes
    await createIndexes(trialsCollection);

    // Process trials in batches to avoid overwhelming the database
    const batchSize = 500;
    for (let i = 0; i < trials.length; i += batchSize) {
      const batch = trials.slice(i, i + batchSize);
      // Use "upsert" to avoid duplicates if the script is run multiple times
      const operations = batch.map(trial => ({
          updateOne: {
              filter: { nctId: trial.nctId },
              update: { $set: trial },
              upsert: true
          }
      }));
      if (operations.length > 0) {
          await trialsCollection.bulkWrite(operations);
      }
      console.log(`Inserted/updated batch ${Math.floor(i / batchSize) + 1} (${batch.length} trials)`);
    }

    console.log(`All ${trials.length} trials loaded successfully.`);
  } finally {
    await client.close();
    console.log('MongoDB connection closed.');
  }
}

module.exports = { loadTrialsToMongoDB };