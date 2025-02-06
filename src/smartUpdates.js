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
        
        // Analyze current file and suggest updates
        const prompt = `Analyze this code and suggest improvements or additions:
            Current file: ${fileName}
            ${fileContext}
            
            Code to analyze:
            ${fullText}
            
            Provide specific suggestions for:
            1. Code improvements
            2. Missing functionality
            3. Best practices
            4. Potential bugs
            
            Format the response as:
            {
                "suggestions": [
                    {
                        "type": "improvement|addition|fix",
                        "location": "line number or function name",
                        "code": "actual code to insert/modify",
                        "description": "explanation of the change"
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
            const items = suggestions.map(s => ({
                label: `${s.type}: ${s.location}`,
                description: s.description,
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
            suggestion.code
        );
    }

    parseSuggestions(response) {
        try {
            const parsed = JSON.parse(response);
            return parsed.suggestions || [];
        } catch (error) {
            console.error('Failed to parse suggestions:', error);
            return [];
        }
    }
}

module.exports = new SmartUpdateManager(); 