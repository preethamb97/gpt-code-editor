class ClipboardManager {
    constructor() {
        this.vscode = require('vscode');
    }

    async copyToClipboard(code, language = '') {
        try {
            const formattedCode = this.formatCode(code, language);
            await this.vscode.env.clipboard.writeText(formattedCode);
            this.vscode.window.showInformationMessage('Code copied to clipboard');
        } catch (error) {
            this.vscode.window.showErrorMessage('Failed to copy code: ' + error.message);
        }
    }

    formatCode(code, language) {
        if (!language) {
            return code;
        }
        return '```' + language + '\n' + code + '\n```';
    }
}

module.exports = new ClipboardManager(); 