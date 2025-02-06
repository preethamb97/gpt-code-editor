const vscode = require('vscode');

class PromptManager {
    constructor() {
        this.validActions = ['CREATE', 'MODIFY', 'DELETE'];
        this.validChangeTypes = ['INLINE', 'BLOCK', 'APPEND', 'PREPEND'];
    }

    parsePrompt(promptText) {
        try {
            const sections = promptText.split('\n');
            const result = {};
            let currentSection = null;
            let codeContent = [];
            let isInCodeBlock = false;

            for (const line of sections) {
                if (line.startsWith('ACTION:')) {
                    result.action = line.replace('ACTION:', '').trim();
                } else if (line.startsWith('FILE:')) {
                    result.file = line.replace('FILE:', '').trim();
                } else if (line.startsWith('DESCRIPTION:')) {
                    result.description = line.replace('DESCRIPTION:', '').trim();
                } else if (line.startsWith('LOCATION:')) {
                    result.location = line.replace('LOCATION:', '').trim();
                } else if (line.startsWith('CHANGE_TYPE:')) {
                    result.changeType = line.replace('CHANGE_TYPE:', '').trim();
                } else if (line.startsWith('CODE:')) {
                    isInCodeBlock = true;
                } else if (isInCodeBlock) {
                    codeContent.push(line);
                }
            }

            result.code = codeContent.join('\n').trim();
            return this.validatePrompt(result);
        } catch (error) {
            throw new Error(`Invalid prompt format: ${error.message}`);
        }
    }

    validatePrompt(parsedPrompt) {
        if (!parsedPrompt.action || !this.validActions.includes(parsedPrompt.action)) {
            throw new Error('Invalid or missing ACTION');
        }

        if (!parsedPrompt.file) {
            throw new Error('Missing FILE path');
        }

        if (!parsedPrompt.description) {
            throw new Error('Missing DESCRIPTION');
        }

        if (parsedPrompt.action === 'MODIFY') {
            if (!parsedPrompt.location) {
                throw new Error('MODIFY action requires LOCATION');
            }
            if (!parsedPrompt.changeType || !this.validChangeTypes.includes(parsedPrompt.changeType)) {
                throw new Error('Invalid or missing CHANGE_TYPE for MODIFY action');
            }
        }

        return parsedPrompt;
    }
}

module.exports = new PromptManager(); 