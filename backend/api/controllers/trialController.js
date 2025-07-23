const Trial = require('../../models/Trial');
const trialEnrichmentService = require('../../services/trialEnrichmentService'); // Still needed for related trials

/**
 * A helper function to parse pagination parameters from the request query.
 * @param {object} query - The req.query object from Express.
 * @returns {{page: number, limit: number, skip: number}}
 */
const parsePagination = (query) => {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

/**
 * Controller to get a paginated list of all trials, with optional filtering.
 * Corresponds to: GET /api/trials
 */
exports.getTrials = async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query);
        const { status, phase, condition, sponsor, hasResults } = req.query;

        const filter = {};
        if (status) filter.status = { $regex: status, $options: 'i' };
        if (phase) filter.phase = phase;
        if (condition) filter.conditions = { $regex: condition, $options: 'i' };
        if (sponsor) filter['sponsors.lead.name'] = { $regex: sponsor, $options: 'i' };
        if (hasResults) filter.resultsAvailable = hasResults === 'true';

        const trials = await Trial.find(filter)
            .sort({ lastUpdateDate: -1 })
            .skip(skip)
            .limit(limit)
            .select('nctId title status phase conditions startDate');
        
        const totalTrials = await Trial.countDocuments(filter);

        res.json({
            totalPages: Math.ceil(totalTrials / limit),
            currentPage: page,
            totalTrials,
            trials,
        });
    } catch (error) {
        console.error("Error in getTrials:", error);
        res.status(500).json({ message: 'Error retrieving trials', error: error.message });
    }
};

/**
 * Controller for text-based search.
 * Corresponds to: GET /api/trials/search
 */
exports.searchTrials = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ message: 'Query parameter "q" is required' });
        }
        const { page, limit, skip } = parsePagination(req.query);
        
        // This uses the MongoDB text index we created.
        const searchQuery = { $text: { $search: q } };

        const trials = await Trial.find(searchQuery)
            .sort({ score: { $meta: 'textScore' } }) // Sort by text search relevance
            .skip(skip)
            .limit(limit)
            .select('nctId title status phase conditions startDate');

        const totalTrials = await Trial.countDocuments(searchQuery);

        res.json({
            query: q,
            totalPages: Math.ceil(totalTrials / limit),
            currentPage: page,
            totalTrials,
            trials,
        });
    } catch (error) {
        console.error("Error in searchTrials:", error);
        res.status(500).json({ message: 'Error searching trials', error: error.message });
    }
};

/**
 * Controller to get a single, complete trial document by its ID.
 * Corresponds to: GET /api/trials/:nctId
 */
exports.getTrialById = async (req, res) => {
    try {
        // This is now very simple: just find the document.
        // All AI enrichment happens in the background via the Atlas Trigger.
        const trial = await Trial.findOne({ nctId: req.params.nctId });
        
        if (!trial) {
            return res.status(404).json({ message: 'Trial not found' });
        }
        res.json(trial);
    } catch (error) {
        console.error("Error in getTrialById:", error);
        res.status(500).json({ message: 'Error retrieving trial', error: error.message });
    }
};

/**
 * Controller to get just the summary for a trial.
 * Corresponds to: GET /api/trials/:nctId/summary
 */
exports.getTrialSummary = async (req, res) => {
    try {
        // Efficiently fetches only the summary field.
        const trial = await Trial.findOne({ nctId: req.params.nctId }).select('summary');
        
        if (!trial) {
            return res.status(404).json({ message: 'Trial not found' });
        }
        // Return the summary if it exists, or a helpful fallback message.
        res.json({ summary: trial.summary || "Summary is being generated. Please check back shortly." });
    } catch (error) {
        console.error("Error in getTrialSummary:", error);
        res.status(500).json({ message: 'Error retrieving summary', error: error.message });
    }
};

/**
 * Controller to find semantically similar trials using Vector Search.
 * Corresponds to: GET /api/trials/:nctId/related
 */
exports.getRelatedTrials = async (req, res) => {
    try {
        const relatedTrials = await trialEnrichmentService.findRelatedTrials(req.params.nctId);
        res.json(relatedTrials);
    } catch (error) {
        console.error("Error in getRelatedTrials:", error);
        res.status(500).json({ message: 'Error finding related trials', error: error.message });
    }
};


/**
 * Controller to get high-level statistics about the trial data.
 * Corresponds to: GET /api/trials/stats/overview
 */
exports.getTrialStatistics = async (req, res) => {
    try {
        // Using Promise.all to run aggregation queries in parallel for better performance.
        const [topConditions, statusCounts, trialsByYear] = await Promise.all([
            Trial.aggregate([
                { $unwind: '$conditions' },
                { $group: { _id: '$conditions', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),
            Trial.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            Trial.aggregate([
                { $match: { startDate: { $ne: null } } },
                { $group: { _id: { $year: '$startDate' }, count: { $sum: 1 } } },
                { $sort: { _id: -1 } },
                { $limit: 10 }
            ])
        ]);

        res.json({ topConditions, statusCounts, trialsByYear });
    } catch (error) {
         console.error("Error in getTrialStatistics:", error);
         res.status(500).json({ message: 'Error getting trial statistics', error: error.message });
    }
};

// We are not using this endpoint in the current frontend, but it's here for future use.
exports.predictTrialOutcome = async (req, res) => {
    // This would require its own logic, similar to the summary/embedding generation.
    // For now, we can return a placeholder.
    res.json({
        message: "Prediction feature is under development."
    });
};