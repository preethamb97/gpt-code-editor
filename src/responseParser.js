const ErrorHandler = require('./errorHandler');

class ResponseParser {
    static parseResponse(response, outputChannel) {
        try {
            console.log("ResponseParser parseResponse response:", response);
            // First try to parse as JSON
            if (typeof response === 'string') {
                // Look for JSON object in the response
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    response = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('No JSON object found in response');
                }
            }

            // Validate required fields
            this.validateResponse(response);
            
            return {
                isCodeChange: true,
                file: response.file,
                lineNumber: response.lineNumber,
                code: response.code,
                imports: response.imports || [],
                considerations: response.considerations || [],
                rawResponse: response
            };
        } catch (error) {
            return ErrorHandler.handleResponseError(error, outputChannel);
        }
    }

    static validateResponse(response) {
        const requiredFields = ['file', 'lineNumber', 'code'];
        const missingFields = requiredFields.filter(field => !response.hasOwnProperty(field));
        
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        if (typeof response.lineNumber !== 'number') {
            throw new Error('lineNumber must be a number');
        }

        if (response.imports && !Array.isArray(response.imports)) {
            throw new Error('imports must be an array');
        }

        if (response.considerations && !Array.isArray(response.considerations)) {
            throw new Error('considerations must be an array');
        }
    }
}

module.exports = ResponseParser; 