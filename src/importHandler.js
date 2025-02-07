const vscode = require('vscode');
const fs = require('fs-extra');
const path = require('path');

class ImportHandler {
    static async addImports(filePath, imports) {
        if (!imports || imports.length === 0) {
            return;
        }

        try {
            // Read the current file content
            const content = await fs.readFile(filePath, 'utf8');
            const lines = content.split('\n');

            // Find the last import statement
            let lastImportIndex = -1;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].match(/^(const|let|var|import)/)) {
                    lastImportIndex = i;
                } else if (lines[i].trim() !== '' && !lines[i].startsWith('//')) {
                    break;
                }
            }

            // Generate import statements
            const importStatements = imports.map(imp => {
                if (imp.location.endsWith('.js')) {
                    return `const ${imp.name} = require('${imp.location}');`;
                } else {
                    return `import ${imp.name} from '${imp.location}';`;
                }
            });

            // Insert imports after the last import or at the beginning
            const insertIndex = lastImportIndex >= 0 ? lastImportIndex + 1 : 0;
            lines.splice(insertIndex, 0, ...importStatements, '');

            // Write back to file
            await fs.writeFile(filePath, lines.join('\n'));
            return true;
        } catch (error) {
            throw new Error(`Failed to add imports: ${error.message}`);
        }
    }

    static async validateImports(imports, filePath) {
        const validatedImports = [];
        for (const imp of imports) {
            try {
                const resolvedPath = this.resolveImportPath(imp.location, filePath);
                if (await fs.pathExists(resolvedPath)) {
                    validatedImports.push(imp);
                } else {
                    vscode.window.showWarningMessage(`Import not found: ${imp.location}`);
                }
            } catch (error) {
                vscode.window.showWarningMessage(`Invalid import: ${imp.location}`);
            }
        }
        return validatedImports;
    }

    static resolveImportPath(importPath, currentFilePath) {
        if (importPath.startsWith('.')) {
            return path.resolve(path.dirname(currentFilePath), importPath);
        }
        return importPath;
    }
}

module.exports = ImportHandler; 