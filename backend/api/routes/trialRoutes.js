// backend/api/routes/trialRoutes.js
const express = require('express');
const router = express.Router();
const trialController = require('../controllers/trialController');

// Main search and filter endpoint
router.get('/', trialController.getTrials);

// Natural Language Query search endpoint
router.get('/search', trialController.searchTrials);

// Get trial statistics
router.get('/stats/overview', trialController.getTrialStatistics);

// Get a single trial by its NCT ID
router.get('/:nctId', trialController.getTrialById);

// Get AI-generated summary for a specific trial
router.get('/:nctId/summary', trialController.getTrialSummary);

// Get related trials using vector search
router.get('/:nctId/related', trialController.getRelatedTrials);

// Get AI prediction for a trial's outcome
router.get('/:nctId/predict', trialController.predictTrialOutcome);

module.exports = router;