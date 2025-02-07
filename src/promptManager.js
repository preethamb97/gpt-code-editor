const vscode = require('vscode');

class PromptManager {
    constructor() {
        this.validTypes = ['modification', 'addition', 'deletion'];
    }

    parsePrompt(response) {
        try {
            const parsedResponse = JSON.parse(response);
            
            if (!parsedResponse.changes || !Array.isArray(parsedResponse.changes)) {
                throw new Error('Invalid response format: missing or invalid changes array');
            }

            // Validate each change object
            parsedResponse.changes.forEach(change => this.validateChange(change));

            return parsedResponse;
        } catch (error) {
            throw new Error(`Failed to parse prompt: ${error.message}`);
        }
    }

    validateChange(change) {
        // Required fields based on PROMPT.md
        const requiredFields = [
            'file',
            'fromLine',
            'toLine',
            'type',
            'add',
            'remove',
            'imports',
            'considerations'
        ];

        // Check all required fields exist
        for (const field of requiredFields) {
            if (!change[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Validate type
        if (!this.validTypes.includes(change.type)) {
            throw new Error(`Invalid change type: ${change.type}`);
        }

        // Validate line numbers
        if (typeof change.fromLine !== 'number' || typeof change.toLine !== 'number') {
            throw new Error('Line numbers must be numeric');
        }

        if (change.fromLine > change.toLine) {
            throw new Error('fromLine cannot be greater than toLine');
        }

        // Validate imports array
        if (!Array.isArray(change.imports)) {
            throw new Error('imports must be an array');
        }

        change.imports.forEach(imp => {
            if (!imp.name || !imp.location) {
                throw new Error('Each import must have name and location');
            }
        });

        // Validate considerations array
        if (!Array.isArray(change.considerations) || change.considerations.length === 0) {
            throw new Error('considerations must be a non-empty array');
        }

        return change;
    }
}

module.exports = new PromptManager(); 