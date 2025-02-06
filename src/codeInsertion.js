const vscode = require('vscode');

class CodeInsertionManager {
    static async insertCodeAtCursor(code) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active editor');
        }

        await editor.edit(editBuilder => {
            editBuilder.insert(editor.selection.active, code);
        });
    }

    static async showDiffAndInsert(originalText, newCode, description = 'Generated Code Change') {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active editor');
        }

        const changeManager = require('./changeManager');
        const changeId = await changeManager.createChange(
            originalText,
            newCode,
            description,
            editor.document.uri.fsPath
        );

        await changeManager.reviewChange(changeId);
    }
}

module.exports = CodeInsertionManager; 