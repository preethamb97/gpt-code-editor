const vscode = require('vscode');
const ollamaService = require('./ollamaService');

class ChatInterface {
    constructor() {
        this.contextProvider = require('./contextProvider');
        this.codeModifier = require('./codeModifier');
        this.selectedFiles = new Set();
        this.messages = [];
        this.outputChannel = vscode.window.createOutputChannel('GPT Code Editor');
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

        // Set up message handling
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
                }
            },
            undefined
        );

        // Initial HTML content
        this.panel.webview.html = this.getWebviewContent();
    }

    getWebviewContent() {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
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
                    pre {
                        white-space: pre-wrap;
                        margin: 5px 0;
                        padding: 10px;
                        background: var(--vscode-editor-background);
                        border-radius: 4px;
                    }
                    .loading {
                        display: none;
                        margin-left: 10px;
                        color: var(--vscode-descriptionForeground);
                    }
                    .loading.active {
                        display: inline;
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
                </style>
            </head>
            <body>
                <div class="chat-container">
                    <div class="messages" id="messages"></div>
                    <div class="input-container">
                        <input type="text" id="userInput" placeholder="Type your message...">
                        <button onclick="sendMessage()" id="sendButton">Send</button>
                        <button onclick="cancelGeneration()" id="cancelButton" class="cancel-button">Cancel</button>
                        <span id="loadingIndicator" class="loading">Generating response...</span>
                    </div>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    const messagesDiv = document.getElementById('messages');
                    const sendButton = document.getElementById('sendButton');
                    const cancelButton = document.getElementById('cancelButton');
                    const loadingIndicator = document.getElementById('loadingIndicator');
                    let abortController = null;
                    
                    // Handle messages sent from the extension
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

                    function setLoading(isLoading) {
                        sendButton.disabled = isLoading;
                        loadingIndicator.classList.toggle('active', isLoading);
                        cancelButton.classList.toggle('active', isLoading);
                        if (!isLoading) {
                            abortController = null;
                        }
                    }

                    function sendMessage() {
                        const input = document.getElementById('userInput');
                        const text = input.value.trim();
                        if (text) {
                            abortController = new AbortController();
                            vscode.postMessage({
                                command: 'sendMessage',
                                text: text,
                                abortSignal: abortController.signal
                            });
                            input.value = '';
                        }
                    }

                    function cancelGeneration() {
                        if (abortController) {
                            abortController.abort();
                            vscode.postMessage({
                                command: 'cancelGeneration'
                            });
                            setLoading(false);
                        }
                    }

                    function updateChatMessages(messages) {
                        messagesDiv.innerHTML = messages.map(msg => {
                            if (msg.type === 'code') {
                                return \`
                                    <div class="code-message">
                                        <strong>AI Code Suggestion:</strong>
                                        <p>\${escapeHtml(msg.description)}</p>
                                        <pre><code>\${escapeHtml(msg.content)}</code></pre>
                                        <button onclick="applyCode('\${msg.changeId}')">Apply Changes</button>
                                    </div>
                                \`;
                            } else {
                                return \`
                                    <div class="message \${msg.role}-message">
                                        <strong>\${msg.role === 'user' ? 'You' : 'AI'}:</strong>
                                        <pre>\${escapeHtml(msg.content)}</pre>
                                    </div>
                                \`;
                            }
                        }).join('');
                        
                        // Scroll to bottom
                        messagesDiv.scrollTop = messagesDiv.scrollHeight;
                    }

                    function escapeHtml(unsafe) {
                        return unsafe
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(/"/g, "&quot;")
                            .replace(/'/g, "&#039;");
                    }

                    function sendMessage() {
                        const input = document.getElementById('userInput');
                        const text = input.value.trim();
                        if (text) {
                            vscode.postMessage({
                                command: 'sendMessage',
                                text: text
                            });
                            input.value = '';
                        }
                    }

                    function applyCode(changeId) {
                        vscode.postMessage({
                            command: 'applyCode',
                            changeId: changeId
                        });
                    }

                    // Handle Enter key
                    document.getElementById('userInput').addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            sendMessage();
                        }
                    });
                </script>
            </body>
            </html>
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
            // Get context from selected files
            let context = '';
            for (const filePath of this.selectedFiles) {
                const document = await vscode.workspace.openTextDocument(filePath);
                context += `File: ${vscode.workspace.asRelativePath(filePath)}\n`;
                context += `\`\`\`\n${document.getText()}\n\`\`\`\n\n`;
            }

            // Create prompt with format guidelines
            const promptTemplate = `
                Given this project context:
                ${context}

                Generate code according to this request:
                ${userInput}

                Follow this format for the response:
                ACTION: [CREATE|MODIFY|DELETE]
                FILE: [filename with path]
                DESCRIPTION: [brief description]
                LOCATION: [line number or "end"]
                CHANGE_TYPE: [INLINE|BLOCK|APPEND|PREPEND]
                CODE:
                \`\`\`language
                // generated code here
                \`\`\`
            `;

            const response = await ollamaService.generateResponse(promptTemplate);
            await this.handleCodeResponse(response);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate code: ${error.message}`);
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

    async handleMessage(message) {
        switch (message.command) {
            case 'sendMessage':
                await this.handleChatMessage(message.text, message.abortSignal);
                break;
            case 'applyCode':
                await this.applyCodeChanges(message.changeId);
                break;
            case 'cancelGeneration':
                // Already handled by the abort controller in the webview
                break;
        }
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

            this.outputChannel.appendLine('\nPrompt sent to Ollama:');
            this.outputChannel.appendLine(prompt);

            const response = await ollamaService.generateResponse(prompt, signal);
            
            this.outputChannel.appendLine('\nOllama Response:');
            this.outputChannel.appendLine(response);

            if (signal?.aborted) {
                this.outputChannel.appendLine('\nGeneration cancelled by user');
                return;
            }

            // Add the assistant's response to messages immediately
            this.messages.push({ role: 'assistant', content: response });
            await this.updateWebview();

            // If the response contains code changes, handle them separately
            if (response.includes('ACTION:')) {
                const promptManager = require('./promptManager');
                const parsedPrompt = promptManager.parsePrompt(response);
                
                // Add a separate code message
                this.messages.push({
                    type: 'code',
                    content: response,
                    description: parsedPrompt.description,
                    changeId: await this.codeModifier.applyChange(parsedPrompt)
                });
                await this.updateWebview();
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                this.messages.push({ role: 'system', content: 'Generation cancelled.' });
                this.outputChannel.appendLine('\nGeneration cancelled by user');
            } else {
                this.outputChannel.appendLine(`\nError: ${error.message}`);
                this.messages.push({ role: 'system', content: `Error: ${error.message}` });
                vscode.window.showErrorMessage(`Failed to process message: ${error.message}`);
            }
            await this.updateWebview();
        }
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
            context += `\`\`\`\n${document.getText()}\n\`\`\`\n\n`;
        }
        return context;
    }

    createPromptWithContext(context, userInput) {
        return `
            Given this project context:
            ${context}

            User request: ${userInput}

            If code changes are needed, format the response using:
            ACTION: [CREATE|MODIFY|DELETE]
            FILE: [filename with path]
            DESCRIPTION: [brief description]
            LOCATION: [line number or "end"]
            CHANGE_TYPE: [INLINE|BLOCK|APPEND|PREPEND]
            CODE:
            \`\`\`language
            // generated code here
            \`\`\`

            If no code changes are needed, respond conversationally.
        `;
    }
}

module.exports = new ChatInterface(); 