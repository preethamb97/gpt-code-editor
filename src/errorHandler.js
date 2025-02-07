const vscode = require('vscode');

class ErrorHandler {
    static handleResponseError(error, outputChannel) {
        outputChannel.appendLine('\n--- Error Processing Response ---');
        outputChannel.appendLine(error.message);

        if (error.name === 'SyntaxError') {
            return {
                isCodeChange: false,
                content: 'I encountered an error parsing the response. Please try rephrasing your request.',
                error: true
            };
        }

        if (error.message.includes('Missing required field')) {
            return {
                isCodeChange: false,
                content: 'The response was missing required information. Please try again with more specific instructions.',
                error: true
            };
        }

        if (error.message.includes('Invalid import')) {
            return {
                isCodeChange: false,
                content: 'There was an issue with the specified imports. Please verify the import paths and try again.',
                error: true
            };
        }

        // Default error response
        return {
            isCodeChange: false,
            content: `An error occurred: ${error.message}. Please try again.`,
            error: true
        };
    }

    static handleCodeModificationError(error, outputChannel) {
        outputChannel.appendLine('\n--- Error Modifying Code ---');
        outputChannel.appendLine(error.message);

        const errorMessage = this.getDetailedErrorMessage(error);
        vscode.window.showErrorMessage(errorMessage);

        return {
            isCodeChange: false,
            content: errorMessage,
            error: true
        };
    }

    static getDetailedErrorMessage(error) {
        if (error.message.includes('No active editor')) {
            return 'Please open a file before attempting to modify code.';
        }
        if (error.message.includes('File already exists')) {
            return 'Cannot create file: A file with this name already exists.';
        }
        if (error.message.includes('Invalid location')) {
            return 'The specified line number or location is invalid.';
        }
        return `Failed to modify code: ${error.message}`;
    }
}

module.exports = ErrorHandler; 