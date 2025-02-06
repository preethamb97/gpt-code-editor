const vscode = require('vscode');

class ChangeManager {
    constructor() {
        this.pendingChanges = new Map();
        this.changeCounter = 0;
    }

    async createChange(originalText, newText, description, filePath) {
        const changeId = this.changeCounter++;
        const change = {
            id: changeId,
            original: originalText,
            modified: newText,
            description,
            filePath,
            status: 'pending'
        };

        this.pendingChanges.set(changeId, change);
        return changeId;
    }

    async reviewChange(changeId) {
        const change = this.pendingChanges.get(changeId);
        if (!change) return false;

        const uri = vscode.Uri.file(change.filePath);
        const originalUri = uri.with({ scheme: 'proposed', path: `${uri.path}.original` });
        const modifiedUri = uri.with({ scheme: 'proposed', path: `${uri.path}.modified` });

        const contentProvider = {
            provideTextDocumentContent(uri) {
                return uri.path.endsWith('.original') ? change.original : change.modified;
            }
        };

        const registration = vscode.workspace.registerTextDocumentContentProvider('proposed', contentProvider);

        // Show diff view
        await vscode.commands.executeCommand('vscode.diff', 
            originalUri, 
            modifiedUri, 
            `Proposed Change: ${change.description}`
        );

        // Show actions in notification
        const decision = await vscode.window.showInformationMessage(
            `Apply this change? ${change.description}`,
            { modal: true },
            { title: 'Apply', isCloseAffordance: false },
            { title: 'Modify', isCloseAffordance: false },
            { title: 'Reject', isCloseAffordance: true }
        );

        registration.dispose();

        if (!decision) return false;

        switch (decision.title) {
            case 'Apply':
                await this.applyChange(change);
                break;
            case 'Modify':
                await this.modifyChange(change);
                break;
            case 'Reject':
                this.rejectChange(changeId);
                break;
        }

        return true;
    }

    async applyChange(change) {
        const editor = await this.openFile(change.filePath);
        if (!editor) return;

        await editor.edit(editBuilder => {
            const fullRange = new vscode.Range(
                editor.document.positionAt(0),
                editor.document.positionAt(editor.document.getText().length)
            );
            editBuilder.replace(fullRange, change.modified);
        });

        this.pendingChanges.delete(change.id);
        await vscode.window.showInformationMessage('Change applied successfully!');
    }

    async modifyChange(change) {
        const editor = await vscode.window.showTextDocument(
            await vscode.workspace.openTextDocument({
                content: change.modified,
                language: 'javascript'
            })
        );

        const modified = await new Promise(resolve => {
            const listener = vscode.workspace.onDidCloseTextDocument(doc => {
                listener.dispose();
                resolve(doc.getText());
            });
        });

        change.modified = modified;
        await this.reviewChange(change.id);
    }

    rejectChange(changeId) {
        this.pendingChanges.delete(changeId);
        vscode.window.showInformationMessage('Change rejected');
    }

    async openFile(filePath) {
        try {
            const document = await vscode.workspace.openTextDocument(filePath);
            return await vscode.window.showTextDocument(document);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open file: ${error.message}`);
            return null;
        }
    }
}

module.exports = new ChangeManager(); 