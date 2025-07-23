// data-pipeline/processors/trialProcessor.js (Corrected Version)

function extractEnrollment(trial) {
    const enrollmentInfo = trial.protocolSection?.designModule?.enrollmentInfo;
    return {
        count: enrollmentInfo?.count ?? null, // Use ?? to allow 0
        type: enrollmentInfo?.type || "N/A"
    };
}

// THIS FUNCTION WAS THE PROBLEM. The conditions are in a different module.
function extractConditions(trial) {
    return trial.protocolSection?.conditionsModule?.conditions || [];
}

function extractInterventions(trial) {
    const interventions = [];
    const armsInterventions = trial.protocolSection?.armsInterventionsModule?.interventions;
    if (armsInterventions) {
        for (const intervention of armsInterventions) {
            interventions.push({
                type: intervention.type || 'N/A',
                name: intervention.name || 'N/A',
                description: intervention.description || ''
            });
        }
    }
    return interventions;
}

// In data-pipeline/processors/trialProcessor.js
function extractEligibility(trial) {
    const eligibilityModule = trial.protocolSection?.eligibilityModule;

    // If the whole module is missing, return empty defaults.
    if (!eligibilityModule) {
        return { 
            criteria: '', 
            minAge: null, 
            maxAge: null, 
            gender: 'All', 
            healthyVolunteers: false 
        };
    }

    // CORRECTLY reference the 'criteria' field.
    return {
        criteria: eligibilityModule.criteria || '', 
        minAge: eligibilityModule.minimumAge || null,
        maxAge: eligibilityModule.maximumAge || null,
        gender: eligibilityModule.gender || 'All',
        healthyVolunteers: eligibilityModule.healthyVolunteers === 'Yes'
    };
}

function extractLocations(trial) {
    const locations = [];
    const contactsLocations = trial.protocolSection?.contactsLocationsModule?.locations;
    if (contactsLocations) {
        for (const location of contactsLocations) {
            locations.push({
                facility: location.facility || '',
                city: location.city || '',
                state: location.state || '',
                country: location.country || '',
                status: location.status || ''
            });
        }
    }
    return locations;
}

function extractSponsors(trial) {
    const sponsorCollaborators = trial.protocolSection?.sponsorCollaboratorsModule;
    const sponsors = {
        lead: null,
        collaborators: []
    };
    if (sponsorCollaborators?.leadSponsor) {
        sponsors.lead = {
            name: sponsorCollaborators.leadSponsor.name || 'N/A',
            class: sponsorCollaborators.leadSponsor.class || 'N/A'
        };
    }
    if (sponsorCollaborators?.collaborators) {
        for (const collaborator of sponsorCollaborators.collaborators) {
           sponsors.collaborators.push({
                name: collaborator.name || 'N/A',
                class: collaborator.class || 'N/A'
           }); 
        }
    }
    return sponsors;
}

function hasResults(trial) {
    return trial.hasResults || false;
}

function calculateStudyDuration(startDate, completionDate) {
    if (!startDate || !completionDate) return null;
    try {
        const start = new Date(startDate);
        const end = new Date(completionDate);
        const durationMs = end - start;
        if (durationMs < 0) return null;
        return Math.floor(durationMs / (1000 * 60 * 60 * 24));
    } catch (e) {
        return null;
    }
}

async function processTrialData(rawTrials) {
  const processedTrials = [];
  for (const trial of rawTrials) {
    if (!trial.protocolSection) continue;

    const p = trial.protocolSection;
    const processedTrial = {
      nctId: p.identificationModule?.nctId || null,
      title: p.identificationModule?.briefTitle || '',
      officialTitle: p.identificationModule?.officialTitle || '',
      status: p.statusModule?.overallStatus || '',
      phase: p.designModule?.phases || [],
      studyType: p.designModule?.type || '',
      enrollment: extractEnrollment(trial),
      conditions: extractConditions(trial), // Correctly calling the function
      interventions: extractInterventions(trial),
      eligibility: extractEligibility(trial),
      locations: extractLocations(trial),
      startDate: p.statusModule?.startDateStruct?.date || null,
      completionDate: p.statusModule?.completionDateStruct?.date || null,
      lastUpdateDate: p.statusModule?.lastUpdatePostDateStruct?.date || null,
      sponsors: extractSponsors(trial),
      resultsAvailable: hasResults(trial),
      studyDuration: calculateStudyDuration(
        p.statusModule?.startDateStruct?.date,
        p.statusModule?.completionDateStruct?.date
      ),
    };

    if (!processedTrial.nctId) continue;
    processedTrials.push(processedTrial);
  }
  return processedTrials;
}

module.exports = { processTrialData };