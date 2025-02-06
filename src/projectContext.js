const vscode = require('vscode');
const fs = require('fs-extra');
const path = require('path');

class ProjectContextManager {
    constructor() {
        this.fileTypes = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.css', '.html'];
    }

    async getRelevantFiles(searchTerm = '') {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return [];
        }

        const relevantFiles = [];
        for (const folder of workspaceFolders) {
            await this.searchDirectory(folder.uri.fsPath, relevantFiles, searchTerm);
        }
        return relevantFiles;
    }

    async searchDirectory(dirPath, results, searchTerm) {
        const files = await fs.readdir(dirPath);
        
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = await fs.stat(filePath);

            if (stats.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                await this.searchDirectory(filePath, results, searchTerm);
            } else if (this.fileTypes.includes(path.extname(file))) {
                const content = await fs.readFile(filePath, 'utf8');
                if (!searchTerm || content.includes(searchTerm)) {
                    results.push({
                        path: filePath,
                        content: content
                    });
                }
            }
        }
    }

    async getContextForPrompt(searchTerm) {
        const relevantFiles = await this.getRelevantFiles(searchTerm);
        let context = 'Project context:\n\n';
        
        for (const file of relevantFiles.slice(0, 3)) { // Limit to 3 most relevant files
            const relativePath = vscode.workspace.asRelativePath(file.path);
            context += `File: ${relativePath}\n\`\`\`\n${file.content}\n\`\`\`\n\n`;
        }
        
        return context;
    }
}

module.exports = new ProjectContextManager(); 