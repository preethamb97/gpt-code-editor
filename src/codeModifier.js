const vscode = require('vscode');
const fs = require('fs-extra');
const path = require('path');
const ImportHandler = require('./importHandler');

class CodeModifier {
    static async applyChange(change) {
        try {
            let changeId;
            
            // Handle imports first if they exist
            if (change.imports && change.imports.length > 0) {
                const validatedImports = await ImportHandler.validateImports(
                    change.imports,
                    change.file
                );
                await ImportHandler.addImports(change.file, validatedImports);
            }

            // Apply the actual code changes
            switch (change.type) {
                case 'addition':
                    changeId = await this.handleAddition(change);
                    break;
                case 'modification':
                    changeId = await this.handleModification(change);
                    break;
                case 'deletion':
                    changeId = await this.handleDeletion(change);
                    break;
                default:
                    throw new Error(`Unsupported change type: ${change.type}`);
            }

            return changeId;
        } catch (error) {
            throw new Error(`Failed to apply changes: ${error.message}`);
        }
    }

    static async handleAddition(change) {
        const filePath = change.file;
        const dirPath = path.dirname(filePath);
        
        await fs.ensureDir(dirPath);
        const fileExists = await fs.pathExists(filePath);
        
        let originalContent = '';
        if (fileExists) {
            const document = await vscode.workspace.openTextDocument(filePath);
            originalContent = document.getText();
        }

        const newContent = this.insertContent(originalContent, change);
        
        const changeManager = require('./changeManager');
        return await changeManager.createChange(
            originalContent,
            newContent,
            change.considerations.join('\n'),
            filePath
        );
    }

    static async handleModification(change) {
        const document = await vscode.workspace.openTextDocument(change.file);
        const originalContent = document.getText();
        const newContent = this.replaceContent(originalContent, change);

        const changeManager = require('./changeManager');
        return await changeManager.createChange(
            originalContent,
            newContent,
            change.considerations.join('\n'),
            change.file
        );
    }

    static async handleDeletion(change) {
        const document = await vscode.workspace.openTextDocument(change.file);
        const originalContent = document.getText();
        const newContent = this.removeContent(originalContent, change);

        const changeManager = require('./changeManager');
        return await changeManager.createChange(
            originalContent,
            newContent,
            change.considerations.join('\n'),
            change.file
        );
    }

    static insertContent(originalContent, change) {
        const lines = originalContent.split('\n');
        lines.splice(change.fromLine - 1, 0, change.add);
        return lines.join('\n');
    }

    static replaceContent(originalContent, change) {
        const lines = originalContent.split('\n');
        lines.splice(change.fromLine - 1, change.toLine - change.fromLine + 1, change.add);
        return lines.join('\n');
    }

    static removeContent(originalContent, change) {
        const lines = originalContent.split('\n');
        lines.splice(change.fromLine - 1, change.toLine - change.fromLine + 1);
        return lines.join('\n');
    }
}

module.exports = CodeModifier; 