const vscode = require('vscode');
const fs = require('fs-extra');
const path = require('path');

class CodeModifier {
    static async applyChange(parsedPrompt) {
        switch (parsedPrompt.action) {
            case 'CREATE':
                return await this.handleCreateAction(parsedPrompt);
            case 'MODIFY':
                return await this.handleModifyAction(parsedPrompt);
            case 'DELETE':
                return await this.handleDeleteAction(parsedPrompt);
            default:
                throw new Error(`Unsupported action: ${parsedPrompt.action}`);
        }
    }

    static async handleCreateAction(parsedPrompt) {
        const filePath = parsedPrompt.file;
        const dirPath = path.dirname(filePath);
        
        // Create directory if it doesn't exist
        await fs.ensureDir(dirPath);

        // Check if file already exists
        const fileExists = await fs.pathExists(filePath);
        if (fileExists) {
            throw new Error(`File already exists: ${filePath}`);
        }

        // Create new file with the provided code
        const originalContent = '';
        const newContent = parsedPrompt.code;

        const changeManager = require('./changeManager');
        const changeId = await changeManager.createChange(
            originalContent,
            newContent,
            parsedPrompt.description,
            filePath
        );

        return changeId;
    }

    static async handleModifyAction(parsedPrompt) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active editor');
        }

        const document = editor.document;
        const originalContent = document.getText();
        let newContent = originalContent;

        switch (parsedPrompt.changeType) {
            case 'INLINE':
                newContent = this.applyInlineChange(originalContent, parsedPrompt);
                break;
            case 'BLOCK':
                newContent = parsedPrompt.code;
                break;
            case 'APPEND':
                newContent = this.applyAppendChange(originalContent, parsedPrompt);
                break;
            case 'PREPEND':
                newContent = this.applyPrependChange(originalContent, parsedPrompt);
                break;
            default:
                throw new Error(`Unsupported change type: ${parsedPrompt.changeType}`);
        }

        const changeManager = require('./changeManager');
        const changeId = await changeManager.createChange(
            originalContent,
            newContent,
            parsedPrompt.description,
            document.uri.fsPath
        );

        return changeId;
    }

    static async handleDeleteAction(parsedPrompt) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active editor');
        }

        const document = editor.document;
        const originalContent = document.getText();
        
        // Parse location range
        const [startLine, endLine] = parsedPrompt.location.split('-').map(Number);
        const lines = originalContent.split('\n');
        const newLines = lines.filter((_, index) => index < startLine - 1 || index > endLine - 1);
        const newContent = newLines.join('\n');

        const changeManager = require('./changeManager');
        const changeId = await changeManager.createChange(
            originalContent,
            newContent,
            parsedPrompt.description,
            document.uri.fsPath
        );

        return changeId;
    }

    static applyInlineChange(originalContent, parsedPrompt) {
        const lines = originalContent.split('\n');
        const lineNumber = parseInt(parsedPrompt.location) - 1;
        lines[lineNumber] = parsedPrompt.code;
        return lines.join('\n');
    }

    static applyAppendChange(originalContent, parsedPrompt) {
        const lines = originalContent.split('\n');
        const lineNumber = parsedPrompt.location === 'end' 
            ? lines.length 
            : parseInt(parsedPrompt.location);
        lines.splice(lineNumber, 0, parsedPrompt.code);
        return lines.join('\n');
    }

    static applyPrependChange(originalContent, parsedPrompt) {
        const lines = originalContent.split('\n');
        const lineNumber = parseInt(parsedPrompt.location) - 1;
        lines.splice(lineNumber, 0, parsedPrompt.code);
        return lines.join('\n');
    }
}

module.exports = CodeModifier; 