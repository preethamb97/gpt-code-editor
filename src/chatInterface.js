const vscode = require('vscode');
const ollamaService = require('./ollamaService');
const PromptFormatter = require('./promptFormatter');

class ChatInterface {
    constructor() {
        this.contextProvider = require('./contextProvider');
        this.codeModifier = require('./codeModifier');
        this.selectedFiles = new Set();
        this.messages = [];
        this.outputChannel = vscode.window.createOutputChannel('GPT Code Editor');
        this.clipboardManager = require('./clipboardManager');
    }

    async createChatPanel() {
        this.panel = vscode.window.createWebviewPanel(
            'gptChat',
            'GPT Code Editor Chat',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'addFile':
                        await this.handleAddFile();
                        break;
                    case 'generateCode':
                        await this.handleGenerateCode(message.text);
                        break;
                    case 'clearContext':
                        this.selectedFiles.clear();
                        await this.updateFileList();
                        break;
                    case 'sendMessage':
                        await this.handleChatMessage(message.text, message.abortSignal);
                        break;
                    case 'cancelGeneration':
                        // Already handled by the abort controller in the webview
                        break;
                    case 'applyCode':
                        await this.applyCodeChanges(message.changeId);
                        break;
                    case 'copyToClipboard':
                        await this.clipboardManager.copyToClipboard(message.text);
                        break;
                }
            }
        );

        this.panel.webview.html = this.getWebviewContent();
    }

    getWebviewContent() {
        return `
            <!DOCTYPE html>
            <html>
                ${this.getHeader()}
                ${this.getBody()}
            </html>
        `;
    }

    getHeader() {
        return `
            <head>
                <style>
                    ${this.getStyles()}
                </style>
            </head>
        `;
    }

    getStyles() {
        return `
            body { 
                padding: 10px; 
                color: var(--vscode-editor-foreground);
                font-family: var(--vscode-font-family);
            }
            .chat-container { 
                display: flex;
                flex-direction: column;
                height: calc(100vh - 100px);
            }
            .messages {
                flex: 1;
                overflow-y: auto;
                margin-bottom: 20px;
                padding: 10px;
            }
            ${this.getMessageStyles()}
            ${this.getInputStyles()}
            ${this.getButtonStyles()}
            ${this.getCodeBlockStyles()}
        `;
    }

    getMessageStyles() {
        return `
            .message {
                margin: 10px 0;
                padding: 8px;
                border-radius: 4px;
            }
            .user-message {
                background: var(--vscode-editor-background);
                border: 1px solid var(--vscode-editor-lineHighlightBorder);
            }
            .assistant-message {
                background: var(--vscode-editor-inactiveSelectionBackground);
                border: 1px solid var(--vscode-editor-lineHighlightBorder);
            }
            .code-message {
                background: var(--vscode-editor-background);
                border: 1px solid var(--vscode-editor-lineHighlightBorder);
                padding: 10px;
            }
        `;
    }

    getInputStyles() {
        return `
            .input-container {
                display: flex;
                gap: 10px;
                padding: 10px;
                align-items: center;
            }
            #userInput {
                flex: 1;
                padding: 8px;
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                border-radius: 4px;
            }
        `;
    }

    getButtonStyles() {
        return `
            button {
                padding: 8px 15px;
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            button:hover {
                background: var(--vscode-button-hoverBackground);
            }
            .cancel-button {
                background: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
                margin-left: 10px;
                display: none;
            }
            .cancel-button.active {
                display: inline;
            }
        `;
    }

    getCodeBlockStyles() {
        return `
            .code-message {
                background: var(--vscode-editor-background);
                border: 1px solid var(--vscode-editor-lineHighlightBorder);
                border-radius: 4px;
                padding: 12px;
                margin: 8px 0;
            }
            .code-description {
                color: var(--vscode-textPreformat-foreground);
                margin-bottom: 8px;
                font-style: italic;
            }
            .code-block-container {
                position: relative;
                background: var(--vscode-editor-background);
                padding: 8px;
                border-radius: 4px;
            }
            .apply-button, .copy-button {
                position: absolute;
                top: 8px;
                padding: 4px 8px;
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: 2px;
                cursor: pointer;
            }
            .apply-button {
                right: 80px;
            }
            .copy-button {
                right: 8px;
            }
            .apply-button:hover, .copy-button:hover {
                background: var(--vscode-button-hoverBackground);
            }
        `;
    }

    getBody() {
        return `
            <body>
                <div class="chat-container">
                    <div class="messages" id="messages"></div>
                    <div class="input-container">
                        <input type="text" id="userInput" placeholder="Type your message...">
                        <button id="sendButton">Send</button>
                        <button id="cancelButton" class="cancel-button">Cancel</button>
                        <span id="loadingIndicator" class="loading">Generating response...</span>
                    </div>
                </div>
                <script>
                    ${this.getClientScript()}
                </script>
            </body>
        `;
    }

    getClientScript() {
        return `
            const vscode = acquireVsCodeApi();
            const messagesDiv = document.getElementById('messages');
            const sendButton = document.getElementById('sendButton');
            const userInput = document.getElementById('userInput');
            const cancelButton = document.getElementById('cancelButton');
            const loadingIndicator = document.getElementById('loadingIndicator');
            let abortController = null;

            // Initialize message handling
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.type) {
                    case 'updateChat':
                        updateChatMessages(message.messages);
                        break;
                    case 'startLoading':
                        setLoading(true);
                        break;
                    case 'endLoading':
                        setLoading(false);
                        break;
                }
            });

            // Add event listeners
            sendButton.addEventListener('click', () => {
                handleSendMessage();
            });

            userInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleSendMessage();
                }
            });

            function handleSendMessage() {
                const text = userInput.value.trim();
                if (text) {
                    setLoading(true);
                    vscode.postMessage({
                        command: 'sendMessage',
                        text: text
                    });
                    userInput.value = '';
                }
            }

            function setLoading(isLoading) {
                sendButton.disabled = isLoading;
                userInput.disabled = isLoading;
                loadingIndicator.style.display = isLoading ? 'inline' : 'none';
                cancelButton.style.display = isLoading ? 'inline' : 'none';
            }

            function updateChatMessages(messages) {
                messagesDiv.innerHTML = messages.map(msg => {
                    if (msg.type === 'code') {
                        return createCodeMessageHtml(msg);
                    }
                    return createChatMessageHtml(msg);
                }).join('');
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }

            function createChatMessageHtml(msg) {
                return \`
                    <div class="message \${msg.role}-message">
                        <strong>\${msg.role === 'user' ? 'You' : 'AI'}:</strong>
                        <pre>\${escapeHtml(msg.content)}</pre>
                    </div>
                \`;
            }

            function createCodeMessageHtml(msg) {
                return \`
                    <div class="code-message">
                        <div class="code-description">\${escapeHtml(msg.description)}</div>
                        <div class="code-block-container">
                            <pre><code>\${escapeHtml(msg.content)}</code></pre>
                            <button class="apply-button" onclick="applyCode('\${msg.changeId}')">Apply Changes</button>
                            <button class="copy-button" onclick="copyToClipboard(this)">Copy</button>
                        </div>
                    </div>
                \`;
            }

            function escapeHtml(unsafe) {
                return unsafe
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");
            }
        `;
    }

    async handleAddFile() {
        const files = await vscode.workspace.findFiles('**/*.*', '**/node_modules/**');
        const fileItems = files.map(file => ({
            label: vscode.workspace.asRelativePath(file),
            file: file
        }));

        const selected = await vscode.window.showQuickPick(fileItems, {
            canPickMany: true,
            placeHolder: 'Select files for context'
        });

        if (selected) {
            selected.forEach(item => this.selectedFiles.add(item.file.fsPath));
            await this.updateFileList();
        }
    }

    async handleGenerateCode(userInput) {
        try {
            const context = await this.getSelectedFilesContext();
            const prompt = this.createPromptWithContext(context, userInput);

            this.outputChannel.appendLine('\n--- Generating Code ---');
            this.outputChannel.appendLine(`User Input: ${userInput}`);

            const response = await ollamaService.generateResponse(prompt);
            const parsedResponse = JSON.parse(response);

            if (parsedResponse.changes && Array.isArray(parsedResponse.changes)) {
                for (const change of parsedResponse.changes) {
                    // Validate required fields
                    this.validateChangeObject(change);
                    
                    // Apply the change and get change ID
                    const changeId = await this.codeModifier.applyChange(change);
                    
                    // Add messages to chat
                    this.messages.push({ 
                        role: 'assistant', 
                        content: `Proposed change for ${change.file}:\n${change.considerations.map(c => `- ${c}`).join('\n')}`
                    });
                    
                    // Show the change in chat with the appropriate content
                    const displayContent = change.type === 'deletion' ? change.remove : change.add;
                    this.messages.push({
                        type: 'code',
                        content: displayContent,
                        description: change.considerations.join('\n'),
                        changeId: changeId
                    });
                }
            } else {
                throw new Error('Invalid response format: missing or invalid changes array');
            }

            await this.updateWebview();
        } catch (error) {
            this.handleError(error);
        }
    }

    validateChangeObject(change) {
        const requiredFields = ['file', 'fromLine', 'toLine', 'type', 'imports', 'considerations'];
        for (const field of requiredFields) {
            if (!change[field]) {
                throw new Error(`Invalid change object: missing required field '${field}'`);
            }
        }

        // Validate type and corresponding fields
        if (!['modification', 'addition', 'deletion'].includes(change.type)) {
            throw new Error(`Invalid change type: ${change.type}`);
        }

        // Validate add/remove fields based on type
        switch (change.type) {
            case 'modification':
                if (!change.add || !change.remove) {
                    throw new Error('Modification changes require both add and remove fields');
                }
                break;
            case 'addition':
                if (!change.add) {
                    throw new Error('Addition changes require add field');
                }
                break;
            case 'deletion':
                if (!change.remove) {
                    throw new Error('Deletion changes require remove field');
                }
                break;
        }

        // Validate line numbers
        if (typeof change.fromLine !== 'number' || typeof change.toLine !== 'number') {
            throw new Error('Line numbers must be numeric');
        }

        if (change.fromLine > change.toLine) {
            throw new Error('fromLine cannot be greater than toLine');
        }
    }

    async handleCodeResponse(response) {
        const promptManager = require('./promptManager');
        try {
            this.outputChannel.appendLine('\n--- Processing Code Response ---');
            const parsedPrompt = promptManager.parsePrompt(response);
            
            this.outputChannel.appendLine('Parsed Prompt:');
            this.outputChannel.appendLine(JSON.stringify(parsedPrompt, null, 2));

            const changeId = await this.codeModifier.applyChange(parsedPrompt);
            this.outputChannel.appendLine(`Change ID: ${changeId}`);

            const changeManager = require('./changeManager');
            await changeManager.reviewChange(changeId);
        } catch (error) {
            this.outputChannel.appendLine(`Error: ${error.message}`);
            vscode.window.showErrorMessage(`Failed to apply code changes: ${error.message}`);
        }
    }

    async updateFileList() {
        const fileList = Array.from(this.selectedFiles)
            .map(file => vscode.workspace.asRelativePath(file))
            .join('\n');

        await this.panel.webview.postMessage({
            type: 'updateFiles',
            files: fileList
        });
    }

    async handleChatMessage(text, signal) {
        try {
            // Add user message
            this.messages.push({ role: 'user', content: text });
            await this.updateWebview();

            this.outputChannel.appendLine('\n--- New Chat Message ---');
            this.outputChannel.appendLine(`User: ${text}`);

            const context = await this.getSelectedFilesContext();
            const prompt = this.createPromptWithContext(context, text);

            const response = await ollamaService.generateResponse(prompt, signal);
            const responseData = response.response.split('Explanation:')[0];
            console.log("handleChatMessage Response:", responseData, '\n****responseDataEnd');
            
            if (signal?.aborted) {
                this.outputChannel.appendLine('\nGeneration cancelled by user');
                return;
            }

            const parsedResponse = JSON.parse(responseData);
            
            if (parsedResponse.changes && parsedResponse.changes.length > 0) {
                // Handle code changes
                for (const change of parsedResponse.changes) {
                    const changeId = await this.codeModifier.applyChange(change);
                    
                    // Add explanation message first
                    this.messages.push({ 
                        role: 'assistant', 
                        content: `Proposed changes for ${change.file}:\n${change.considerations.map(c => `- ${c}`).join('\n')}`
                    });
                    
                    // Add detailed change information
                    let changeDetails = '';
                    if (change.type === 'addition') {
                        changeDetails = `Adding new code at line ${change.fromLine}:\n${change.add}`;
                    } else if (change.type === 'deletion') {
                        changeDetails = `Removing code from lines ${change.fromLine}-${change.toLine}:\n${change.remove}`;
                    } else if (change.type === 'modification') {
                        changeDetails = `Modifying code at lines ${change.fromLine}-${change.toLine}:\n` +
                            `Original code:\n${change.remove}\n\n` +
                            `New code:\n${change.add}`;
                    }
                    
                    // Add imports information if present
                    if (change.imports && change.imports.length > 0) {
                        changeDetails += '\n\nRequired imports:\n' +
                            change.imports.map(imp => `- ${imp.name} from ${imp.location}`).join('\n');
                    }
                    
                    this.messages.push({
                        type: 'code',
                        content: changeDetails,
                        description: change.considerations.join('\n'),
                        changeId: changeId
                    });
                }
            } else {
                // Handle regular chat message
                this.messages.push({ 
                    role: 'assistant', 
                    content: responseData 
                });
            }

            await this.updateWebview();
        } catch (error) {
            this.handleError(error);
        }
    }

    handleError(error) {
        if (error.name === 'AbortError') {
            this.messages.push({ role: 'system', content: 'Generation cancelled.' });
            this.outputChannel.appendLine('\nGeneration cancelled by user');
        } else {
            this.outputChannel.appendLine(`\nError: ${error.message}`);
            this.messages.push({ role: 'system', content: `Error: ${error.message}` });
            vscode.window.showErrorMessage(`Failed to process message: ${error.message}`);
            console.log("Failed to process message:", error);
        }
        this.updateWebview();
    }

    async applyCodeChanges(changeId) {
        try {
            const changeManager = require('./changeManager');
            await changeManager.reviewChange(changeId);
        } catch (error) {
            vscode.window.showErrorMessage('Failed to apply code changes: ' + error.message);
        }
    }

    async updateWebview() {
        if (this.panel) {
            await this.panel.webview.postMessage({
                type: 'updateChat',
                messages: this.messages
            });
        }
    }

    async getSelectedFilesContext() {
        let context = '';
        for (const filePath of this.selectedFiles) {
            const document = await vscode.workspace.openTextDocument(filePath);
            context += `File: ${vscode.workspace.asRelativePath(filePath)}\n`;
            context += '```\n' + document.getText() + '\n```\n\n';
        }
        return context;
    }

    createPromptWithContext(context, userInput) {
        return PromptFormatter.formatPromptWithContext(context, userInput);
    }
}

module.exports = new ChatInterface(); 