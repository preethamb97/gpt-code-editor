const vscode = require('vscode');
const ollamaService = require('./ollamaService');
const projectContext = require('./projectContext');

class SmartUpdateManager {
    async analyzeAndSuggestUpdates() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active editor');
        }

        const document = editor.document;
        const fullText = document.getText();
        const fileName = document.fileName;

        // Get project context
        const fileContext = await projectContext.getContextForPrompt(fileName);
        
        const prompt = `Analyze the following code and suggest improvements:

File Context:
${fileContext}

Current File Content:
${fullText}

Please provide suggestions in the following format:
{
    "changes": [
        {
            "file": "${fileName}",
            "fromLine": number,
            "toLine": number,
            "type": "modification" | "addition" | "deletion",
            "add": "string",
            "remove": "string",
            "imports": [
                {
                    "name": "import-name",
                    "location": "file/import.js"
                }
            ],
            "considerations": [
                "Reason for the change",
                "Impact on code quality"
            ]
        }
    ]
}`;

        const response = await ollamaService.generateResponse(prompt);
        return this.parseSuggestions(response);
    }

    async showSuggestionsAndApply() {
        try {
            const suggestions = await this.analyzeAndSuggestUpdates();
            
            // Create QuickPick items for each suggestion
            const items = suggestions.changes.map(s => ({
                label: `${s.type}: ${s.file}`,
                description: s.considerations.join(', '),
                suggestion: s
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select suggestions to apply',
                canPickMany: true
            });

            if (selected && selected.length > 0) {
                for (const item of selected) {
                    await this.applySuggestion(item.suggestion);
                }
            }
        } catch (error) {
            throw new Error(`Failed to process suggestions: ${error.message}`);
        }
    }

    async applySuggestion(suggestion) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const CodeInsertionManager = require('./codeInsertion');
        await CodeInsertionManager.showDiffAndInsert(
            editor.document.getText(),
            suggestion.add
        );
    }

    parseSuggestions(response) {
        const parsedResponse = JSON.parse(response);
        if (!parsedResponse.changes || !Array.isArray(parsedResponse.changes)) {
            throw new Error('Invalid response format: missing or invalid changes array');
        }
        return parsedResponse;
    }
}

module.exports = SmartUpdateManager; 