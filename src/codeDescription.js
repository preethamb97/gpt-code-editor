const vscode = require('vscode');
const ollamaService = require('./ollamaService');

class CodeDescriptionProvider {
    constructor() {
        this.decorationType = vscode.window.createTextEditorDecorationType({
            after: {
                margin: '0 0 0 1em',
                textDecoration: 'none; opacity: 0.7;'
            }
        });
    }

    async generateDescription(code) {
        const prompt = `Explain this code concisely in one line:\n${code}`;
        return await ollamaService.generateResponse(prompt);
    }

    async showDescriptionHover(code) {
        const description = await this.generateDescription(code);
        const editor = vscode.window.activeTextEditor;
        
        if (!editor) return;

        // Create hover content
        const content = new vscode.MarkdownString();
        content.appendMarkdown(`📝 **Description**\n\n${description}`);
        content.isTrusted = true;

        return new vscode.Hover(content);
    }

    async showInlineDescription(code, range) {
        const description = await this.generateDescription(code);
        const editor = vscode.window.activeTextEditor;
        
        if (!editor) return;

        editor.setDecorations(this.decorationType, [{
            range,
            renderOptions: {
                after: {
                    contentText: `// ${description}`,
                    color: new vscode.ThemeColor('editorLineNumber.foreground')
                }
            }
        }]);

        // Clear decoration after 5 seconds
        setTimeout(() => {
            editor.setDecorations(this.decorationType, []);
        }, 5000);
    }

    dispose() {
        this.decorationType.dispose();
    }
}

module.exports = new CodeDescriptionProvider(); 