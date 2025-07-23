// backend/models/Trial.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const interventionSchema = new Schema({
    type: String,
    name: String,
    description: String,
}, { _id: false });

const eligibilitySchema = new Schema({
    criteria: String,
    minAge: String,
    maxAge: String,
    gender: String,
    healthyVolunteers: Boolean,
}, { _id: false });

const coordinatesSchema = new Schema({
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
}, { _id: false });

const locationSchema = new Schema({
    facility: String,
    city: String,
    state: String,
    country: String,
    status: String,
    coordinates: coordinatesSchema,
}, { _id: false });

const sponsorSchema = new Schema({
    name: String,
    class: String,
}, { _id: false });

const sponsorsSchema = new Schema({
    lead: sponsorSchema,
    collaborators: [sponsorSchema]
}, { _id: false });

const enrollmentSchema = new Schema({
    count: Number,
    type: String
}, { _id: false });

const relatedTrialSchema = new Schema({
    nctId: String,
    similarity: Number,
}, { _id: false });

const trialSchema = new Schema({
    nctId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    officialTitle: String,
    status: { type: String, index: true },
    phase: { type: [String], index: true },
    studyType: String,
    enrollment: enrollmentSchema,
    conditions: { type: [String], index: true },
    interventions: [interventionSchema],
    eligibility: eligibilitySchema,
    locations: [locationSchema],
    startDate: { type: Date, index: true },
    completionDate: Date,
    lastUpdateDate: { type: Date, index: true },
    sponsors: sponsorsSchema,
    resultsAvailable: Boolean,
    studyDuration: Number,
    
    // AI-generated fields
    embedding: { type: [Number] }, // index is created separately in database.js
    summary: String,
    keywords: [String],
    complexityScore: Number,
    predictedRecruitmentDifficulty: String,
    relatedTrials: [relatedTrialSchema]

}, { timestamps: true });

// Add the text index directly in the schema
trialSchema.index({
    title: 'text',
    officialTitle: 'text',
    'conditions': 'text',
    'interventions.name': 'text',
    'eligibility.criteria': 'text',
    'keywords': 'text'
}, { name: 'text_search_index' })

// Add geospatial index
trialSchema.index({ 'locations.coordinates': '2dsphere' });

const Trial = mongoose.model('Trial', trialSchema);

module.exports = Trial;