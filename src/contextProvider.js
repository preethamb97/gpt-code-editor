const vscode = require('vscode');
const path = require('path');

class ContextProvider {
    constructor() {
        this.relevantFileTypes = ['.js', '.jsx', '.ts', '.tsx', '.json', '.md'];
        this.maxContextFiles = 3;
    }

    async getRelevantContext(searchTerm, currentFile) {
        const workspaceFiles = await this.getAllWorkspaceFiles();
        const rankedFiles = await this.rankFilesByRelevance(workspaceFiles, searchTerm, currentFile);
        return await this.buildContext(rankedFiles.slice(0, this.maxContextFiles));
    }

    async getAllWorkspaceFiles() {
        const files = await vscode.workspace.findFiles('**/*.*', '**/node_modules/**');
        return files.filter(file => 
            this.relevantFileTypes.includes(path.extname(file.fsPath))
        );
    }

    async rankFilesByRelevance(files, searchTerm, currentFile) {
        const rankedFiles = [];
        
        for (const file of files) {
            // Skip the current file
            if (file.fsPath === currentFile) continue;

            const document = await vscode.workspace.openTextDocument(file);
            const content = document.getText();
            const score = this.calculateRelevanceScore(content, searchTerm);
            
            if (score > 0) {
                rankedFiles.push({ file, score });
            }
        }

        return rankedFiles
            .sort((a, b) => b.score - a.score)
            .map(item => item.file);
    }

    calculateRelevanceScore(content, searchTerm) {
        let score = 0;
        const terms = searchTerm.toLowerCase().split(/\s+/);
        
        for (const term of terms) {
            const regex = new RegExp(term, 'gi');
            const matches = content.match(regex);
            if (matches) {
                score += matches.length;
            }
        }

        return score;
    }

    async buildContext(files) {
        let context = '';
        
        for (const file of files) {
            const document = await vscode.workspace.openTextDocument(file);
            const relativePath = vscode.workspace.asRelativePath(file);
            const content = document.getText();
            
            context += `\nFile: ${relativePath}\n\`\`\`\n${content}\n\`\`\`\n`;
        }

        return context.trim();
    }
}

module.exports = new ContextProvider(); 