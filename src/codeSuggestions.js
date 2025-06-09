const vscode = require('vscode');
const ollamaService = require('./ollamaService');

class CodeSuggestionProvider {
    constructor() {
        this.contextProvider = require('./contextProvider');
    }

    activate(context) {
        const provider = vscode.languages.registerInlineCompletionItemProvider(
            { pattern: '**' },
            {
                async provideInlineCompletionItems(document, position, _context, _token) {
                    try {
                        // Get the current line text
                        const lineText = document.lineAt(position.line).text;
                        const linePrefix = lineText.slice(0, position.character);
                        
                        if (linePrefix.trim().length < 3) {
                            return;
                        }

                        // Get surrounding code context
                        const startLine = Math.max(0, position.line - 5);
                        const endLine = Math.min(document.lineCount, position.line + 5);
                        const contextRange = new vscode.Range(
                            startLine, 0,
                            endLine, document.lineAt(endLine - 1).text.length
                        );
                        const surroundingCode = document.getText(contextRange);

                        // Get project context
                        const projectContext = await this.contextProvider.getRelevantContext(
                            linePrefix,
                            document.fileName
                        );

                        // Create prompt with both local and project context
                        const prompt = `
                            Given this project context:
                            ${projectContext}

                            And this current code context:
                            \`\`\`
                            ${surroundingCode}
                            \`\`\`

                            Complete this line:
                            ${linePrefix}

                            Response should be only the completion, no explanations.
                        `;

                        const suggestion = await ollamaService.generateResponse(prompt);
                        
                        if (!suggestion) {
                            return;
                        }

                        return [
                            {
                                text: suggestion.trim(),
                                range: new vscode.Range(position, position)
                            }
                        ];
                    } catch (error) {
                        console.error('Error providing suggestions:', error);
                        return [];
                    }
                }
            }
        );

        context.subscriptions.push(provider);
    }
}

module.exports = new CodeSuggestionProvider(); 