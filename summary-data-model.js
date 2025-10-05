
// Summary Data Model and Validation for NoteBuddy
// Defines the structure and validation for meeting summaries

class SummaryDataModel {
    constructor() {
        this.requiredFields = ['title', 'date', 'duration', 'participants', 'keyPoints', 'actionItems', 'transcript', 'summary'];
        this.optionalFields = ['tags', 'meetingType', 'location', 'attachments'];
    }

    // Create a new summary object with validation
    createSummary(data) {
        const validation = this.validateSummaryData(data);
        if (!validation.isValid) {
            throw new Error(`Invalid summary data: ${validation.errors.join(', ')}`);
        }

        return {
            title: data.title || 'Untitled Meeting',
            date: data.date || new Date().toISOString(),
            duration: data.duration || '00:00',
            participants: Array.isArray(data.participants) ? data.participants : [],
            keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints : [],
            actionItems: Array.isArray(data.actionItems) ? data.actionItems : [],
            transcript: data.transcript || '',
            summary: data.summary || '',
            tags: Array.isArray(data.tags) ? data.tags : [],
            meetingType: data.meetingType || 'General',
            location: data.location || '',
            attachments: Array.isArray(data.attachments) ? data.attachments : [],
            // Metadata
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
            userId: data.userId || null
        };
    }

    // Validate summary data
    validateSummaryData(data) {
        const errors = [];

        // Check required fields
        for (const field of this.requiredFields) {
            if (!data || data[field] === undefined || data[field] === null) {
                errors.push(`Missing required field: ${field}`);
            }
        }

        // Validate specific field types
        if (data.title && typeof data.title !== 'string') {
            errors.push('Title must be a string');
        }

        if (data.date && !this.isValidDate(data.date)) {
            errors.push('Date must be a valid ISO string or Date object');
        }

        if (data.duration && !this.isValidDuration(data.duration)) {
            errors.push('Duration must be in HH:MM format');
        }

        if (data.participants && !Array.isArray(data.participants)) {
            errors.push('Participants must be an array');
        }

        if (data.keyPoints && !Array.isArray(data.keyPoints)) {
            errors.push('Key points must be an array');
        }

        if (data.actionItems && !Array.isArray(data.actionItems)) {
            errors.push('Action items must be an array');
        }

        if (data.transcript && typeof data.transcript !== 'string') {
            errors.push('Transcript must be a string');
        }

        if (data.summary && typeof data.summary !== 'string') {
            errors.push('Summary must be a string');
        }

        if (data.tags && !Array.isArray(data.tags)) {
            errors.push('Tags must be an array');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Validate date format
    isValidDate(date) {
        if (typeof date === 'string') {
            return !isNaN(Date.parse(date));
        }
        return date instanceof Date && !isNaN(date.getTime());
    }

    // Validate duration format (HH:MM or H:MM)
    isValidDuration(duration) {
        if (typeof duration !== 'string') return false;
        // Allow both HH:MM and H:MM formats
        const durationRegex = /^([0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
        return durationRegex.test(duration);
    }

    // Convert legacy summary format to new format
    convertLegacySummary(legacyData) {
        try {
            console.log('🔄 Converting legacy summary data:', legacyData);
            
            // Handle different legacy formats
            let convertedData = { ...legacyData };

            // If summary is an object, extract its properties
            if (legacyData.summary && typeof legacyData.summary === 'object') {
                console.log('📝 Summary is an object, extracting properties...');
                convertedData = {
                    ...legacyData,
                    ...legacyData.summary
                };
                delete convertedData.summary; // Remove the nested object
            }

            // Ensure arrays are properly formatted
            if (convertedData.participants && typeof convertedData.participants === 'string') {
                convertedData.participants = convertedData.participants.split(',').map(p => p.trim());
            }

            // Ensure keyPoints and actionItems are arrays
            if (convertedData.keyPoints && !Array.isArray(convertedData.keyPoints)) {
                convertedData.keyPoints = [convertedData.keyPoints];
            }

            if (convertedData.actionItems && !Array.isArray(convertedData.actionItems)) {
                convertedData.actionItems = [convertedData.actionItems];
            }

            // Ensure required fields have default values
            const finalData = {
                title: convertedData.title || 'Meeting Summary - ' + new Date().toLocaleDateString(),
                date: convertedData.date || new Date().toISOString(),
                duration: convertedData.duration || 'Unknown',
                participants: Array.isArray(convertedData.participants) ? convertedData.participants : [],
                keyPoints: Array.isArray(convertedData.keyPoints) ? convertedData.keyPoints : [],
                actionItems: Array.isArray(convertedData.actionItems) ? convertedData.actionItems : [],
                transcript: convertedData.transcript || '',
                summary: convertedData.summary || convertedData.shortSummary || '',
                tags: Array.isArray(convertedData.tags) ? convertedData.tags : [],
                meetingType: convertedData.meetingType || 'General',
                location: convertedData.location || '',
                attachments: Array.isArray(convertedData.attachments) ? convertedData.attachments : [],
                // Metadata
                createdAt: convertedData.createdAt || new Date().toISOString(),
                updatedAt: convertedData.updatedAt || new Date().toISOString(),
                userId: convertedData.userId || null
            };

            console.log('✅ Converted summary data:', finalData);
            return finalData;
        } catch (error) {
            console.error('❌ Error converting legacy summary:', error);
            console.error('Legacy data that failed:', legacyData);
            throw new Error('Failed to convert legacy summary format: ' + error.message);
        }
    }

    // Generate summary preview text
    generatePreview(summary) {
        const maxLength = 150;
        let preview = summary.summary || summary.transcript || 'No content available';
        
        if (preview.length > maxLength) {
            preview = preview.substring(0, maxLength) + '...';
        }
        
        return preview;
    }

    // Generate searchable text for filtering
    generateSearchText(summary) {
        const searchableFields = [
            summary.title,
            summary.summary,
            summary.transcript,
            ...(summary.participants || []),
            ...(summary.tags || []),
            summary.meetingType,
            summary.location
        ].filter(Boolean);

        return searchableFields.join(' ').toLowerCase();
    }

    // Format summary for display
    formatForDisplay(summary) {
        return {
            id: summary.id,
            title: summary.title,
            date: new Date(summary.date).toLocaleDateString(),
            time: new Date(summary.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            duration: summary.duration,
            participants: summary.participants,
            participantCount: summary.participants.length,
            keyPoints: summary.keyPoints,
            actionItems: summary.actionItems,
            actionItemCount: summary.actionItems.length,
            preview: this.generatePreview(summary),
            tags: summary.tags,
            meetingType: summary.meetingType,
            location: summary.location,
            createdAt: summary.createdAt,
            updatedAt: summary.updatedAt
        };
    }
}

// Create global instance
window.summaryDataModel = new SummaryDataModel();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SummaryDataModel };
}
