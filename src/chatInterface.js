const vscode = require('vscode');
const ollamaService = require('./ollamaService');
const PromptFormatter = require('./promptFormatter');
const logger = require('./logger');

class ChatInterface {
    constructor() {
        this.contextProvider = require('./contextProvider');
        this.codeModifier = require('./codeModifier');
        this.selectedFiles = new Set();
        this.messages = [];
        this.outputChannel = vscode.window.createOutputChannel('GPT Code Editor');
        this.clipboardManager = require('./clipboardManager');
        this.sessionId = Math.random().toString(36).substring(7);
        this.messageCount = 0;
        this.startTime = Date.now();
        
        logger.info('ChatInterface initialized', {
            sessionId: this.sessionId,
            timestamp: new Date().toISOString()
        });
    }

    async createChatPanel() {
        const operationStart = Date.now();
        
        try {
            logger.info('Creating chat panel', { sessionId: this.sessionId });
            
            this.panel = vscode.window.createWebviewPanel(
                'gptChat',
                'GPT Code Editor Chat',
                vscode.ViewColumn.Two,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [vscode.workspace.workspaceFolders?.[0]?.uri].filter(Boolean)
                }
            );

            // Log panel creation
            logger.info('Webview panel created successfully', {
                sessionId: this.sessionId,
                viewColumn: vscode.ViewColumn.Two
            });

            // Enhanced message handling with logging
            this.panel.webview.onDidReceiveMessage(
                async (message) => {
                    const messageStart = Date.now();
                    logger.debug('Received webview message', {
                        sessionId: this.sessionId,
                        command: message.command,
                        messageId: ++this.messageCount
                    });

                    try {
                        switch (message.command) {
                            case 'addFile':
                                await this.handleAddFile();
                                break;
                            case 'generateCode':
                                await this.handleGenerateCode(message.text);
                                break;
                            case 'clearContext':
                                await this.handleClearContext();
                                break;
                            case 'sendMessage':
                                await this.handleChatMessage(message.text, message.abortSignal);
                                break;
                            case 'cancelGeneration':
                                logger.info('Generation cancelled by user', { sessionId: this.sessionId });
                                break;
                            case 'applyCode':
                                await this.applyCodeChanges(message.changeId);
                                break;
                            case 'copyToClipboard':
                                await this.clipboardManager.copyToClipboard(message.text);
                                break;
                            case 'showStats':
                                await this.handleShowStats();
                                break;
                            case 'showLogs':
                                await this.handleShowLogs();
                                break;
                            case 'updateFiles':
                                // This is handled by the webview
                                break;
                            case 'updateStats':
                                // This is handled by the webview
                                break;
                            default:
                                logger.warn('Unknown command received', {
                                    sessionId: this.sessionId,
                                    command: message.command
                                });
                        }
                        
                        await logger.logPerformance(`Handle message: ${message.command}`, messageStart, {
                            sessionId: this.sessionId,
                            messageId: this.messageCount
                        });
                        
                    } catch (error) {
                        logger.error(`Error handling command: ${message.command}`, {
                            sessionId: this.sessionId,
                            error: error.message,
                            stack: error.stack,
                            messageId: this.messageCount
                        });
                        
                        vscode.window.showErrorMessage(`Error: ${error.message}`);
                    }
                }
            );

            // Log when panel is disposed
            this.panel.onDidDispose(() => {
                logger.info('Chat panel disposed', {
                    sessionId: this.sessionId,
                    duration: Date.now() - this.startTime,
                    messagesHandled: this.messageCount
                });
            });

            this.panel.webview.html = this.getWebviewContent();
            
            await logger.logPerformance('Create chat panel', operationStart, {
                sessionId: this.sessionId
            });
            
        } catch (error) {
            logger.error('Failed to create chat panel', {
                sessionId: this.sessionId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
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
            .context-section {
                background: var(--vscode-editor-background);
                border: 1px solid var(--vscode-editor-lineHighlightBorder);
                border-radius: 4px;
                padding: 10px;
                margin-bottom: 10px;
            }
            .context-section h3 {
                margin: 0 0 10px 0;
                color: var(--vscode-editor-foreground);
            }
            .context-controls {
                display: flex;
                gap: 10px;
                margin-bottom: 10px;
            }
            .selected-files {
                max-height: 100px;
                overflow-y: auto;
                font-size: 12px;
                color: var(--vscode-descriptionForeground);
            }
            .stats-display {
                background: var(--vscode-editor-inactiveSelectionBackground);
                border: 1px solid var(--vscode-editor-lineHighlightBorder);
                border-radius: 4px;
                padding: 10px;
                margin-top: 10px;
                font-size: 12px;
            }
            .stats-item {
                display: flex;
                justify-content: space-between;
                margin: 5px 0;
            }
            .stats-label {
                color: var(--vscode-editor-foreground);
                font-weight: bold;
            }
            .stats-value {
                color: var(--vscode-descriptionForeground);
            }
            .file-item {
                padding: 2px 0;
                border-bottom: 1px solid var(--vscode-editor-lineHighlightBorder);
            }
            .no-files {
                color: var(--vscode-descriptionForeground);
                font-style: italic;
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
            .loading {
                color: var(--vscode-editor-foreground);
                font-style: italic;
                display: none;
                margin-left: 10px;
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
                    <div class="context-section">
                        <h3>Context Files</h3>
                        <div class="context-controls">
                            <button id="addFileButton">Add Files</button>
                            <button id="clearContextButton">Clear Context</button>
                            <button id="showStatsButton">Show Stats</button>
                            <button id="showLogsButton">Show Logs</button>
                        </div>
                        <div id="selectedFiles" class="selected-files"></div>
                        <div id="statsDisplay" class="stats-display" style="display: none;"></div>
                    </div>
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
            const addFileButton = document.getElementById('addFileButton');
            const clearContextButton = document.getElementById('clearContextButton');
            const selectedFilesDiv = document.getElementById('selectedFiles');
            const showStatsButton = document.getElementById('showStatsButton');
            const showLogsButton = document.getElementById('showLogsButton');
            const statsDisplay = document.getElementById('statsDisplay');
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
                    case 'updateFiles':
                        updateSelectedFiles(message.files);
                        break;
                    case 'updateStats':
                        updateStatsDisplay(message.stats);
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

            addFileButton.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'addFile'
                });
            });

            clearContextButton.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'clearContext'
                });
            });

            showStatsButton.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'showStats'
                });
            });

            showLogsButton.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'showLogs'
                });
            });

            function handleSendMessage() {
                const text = userInput.value.trim();
                if (text) {
                    abortController = new AbortController();
                    setLoading(true);
                    vscode.postMessage({
                        command: 'sendMessage',
                        text: text,
                        abortSignal: abortController.signal
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

            function updateSelectedFiles(files) {
                if (files) {
                    selectedFilesDiv.innerHTML = files.split('\\n').filter(f => f.trim()).map(file => 
                        \`<div class="file-item">\${escapeHtml(file)}</div>\`
                    ).join('');
                } else {
                    selectedFilesDiv.innerHTML = '<div class="no-files">No files selected</div>';
                }
            }

            function updateStatsDisplay(stats) {
                if (stats) {
                    statsDisplay.style.display = 'block';
                    statsDisplay.innerHTML = \`
                        <h4>Performance Statistics</h4>
                        <div class="stats-item">
                            <span class="stats-label">Session ID:</span>
                            <span class="stats-value">\${stats.sessionId || 'N/A'}</span>
                        </div>
                        <div class="stats-item">
                            <span class="stats-label">Messages Handled:</span>
                            <span class="stats-value">\${stats.messageCount || 0}</span>
                        </div>
                        <div class="stats-item">
                            <span class="stats-label">Session Duration:</span>
                            <span class="stats-value">\${stats.sessionDuration || 'N/A'}</span>
                        </div>
                        <div class="stats-item">
                            <span class="stats-label">Ollama Requests:</span>
                            <span class="stats-value">\${stats.ollamaStats?.requestCount || 0}</span>
                        </div>
                        <div class="stats-item">
                            <span class="stats-label">Total Tokens:</span>
                            <span class="stats-value">\${stats.ollamaStats?.totalTokens || 0}</span>
                        </div>
                        <div class="stats-item">
                            <span class="stats-label">Avg Tokens/Request:</span>
                            <span class="stats-value">\${stats.ollamaStats?.averageTokensPerRequest || 0}</span>
                        </div>
                        <div class="stats-item">
                            <span class="stats-label">Context Files:</span>
                            <span class="stats-value">\${stats.contextFileCount || 0}</span>
                        </div>
                    \`;
                } else {
                    statsDisplay.style.display = 'none';
                }
            }

            // Add missing functions
            function applyCode(changeId) {
                vscode.postMessage({
                    command: 'applyCode',
                    changeId: changeId
                });
            }

            function copyToClipboard(button) {
                const codeBlock = button.parentElement.querySelector('code');
                const text = codeBlock.textContent;
                vscode.postMessage({
                    command: 'copyToClipboard',
                    text: text
                });
            }

            // Cancel button functionality
            cancelButton.addEventListener('click', () => {
                if (abortController) {
                    abortController.abort();
                    abortController = null;
                    setLoading(false);
                }
            });
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
        const messageStart = Date.now();
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        try {
            logger.info('Processing chat message', {
                sessionId: this.sessionId,
                messageId,
                messageLength: text.length,
                contextFileCount: this.selectedFiles.size
            });

            // Add user message
            this.messages.push({ role: 'user', content: text });
            await this.updateWebview();

            this.outputChannel.appendLine('\n--- New Chat Message ---');
            this.outputChannel.appendLine(`User: ${text}`);

            const context = await this.getSelectedFilesContext();
            logger.debug('Context retrieved', {
                sessionId: this.sessionId,
                messageId,
                contextLength: context.length,
                fileCount: this.selectedFiles.size
            });

            const prompt = this.createPromptWithContext(context, text);
            logger.debug('Prompt created', {
                sessionId: this.sessionId,
                messageId,
                promptLength: prompt.length
            });

            const response = await ollamaService.generateResponse(prompt, signal);
            
            if (signal?.aborted) {
                logger.info('Message generation cancelled', {
                    sessionId: this.sessionId,
                    messageId,
                    duration: Date.now() - messageStart
                });
                this.outputChannel.appendLine('\nGeneration cancelled by user');
                return;
            }

            // Handle the response - it could be JSON with changes or plain text
            let responseData;
            try {
                // Try to parse as JSON first
                responseData = JSON.parse(response.response || response);
                
                logger.debug('Response parsed as JSON', {
                    sessionId: this.sessionId,
                    messageId,
                    hasChanges: !!(responseData.changes && responseData.changes.length > 0),
                    changeCount: responseData.changes?.length || 0
                });
                
                if (responseData.changes && responseData.changes.length > 0) {
                    // Handle code changes
                    for (let i = 0; i < responseData.changes.length; i++) {
                        const change = responseData.changes[i];
                        
                        logger.info('Processing code change', {
                            sessionId: this.sessionId,
                            messageId,
                            changeIndex: i,
                            changeType: change.type,
                            file: change.file
                        });

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

                        logger.info('Code change processed successfully', {
                            sessionId: this.sessionId,
                            messageId,
                            changeIndex: i,
                            changeId
                        });
                    }
                } else {
                    // Handle regular chat message
                    this.messages.push({ 
                        role: 'assistant', 
                        content: responseData.message || JSON.stringify(responseData)
                    });

                    logger.info('Regular chat response processed', {
                        sessionId: this.sessionId,
                        messageId,
                        responseLength: (responseData.message || JSON.stringify(responseData)).length
                    });
                }
            } catch (_parseError) {
                // If JSON parsing fails, treat as regular text response
                const textResponse = response.response || response;
                this.messages.push({ 
                    role: 'assistant', 
                    content: textResponse 
                });

                logger.info('Text response processed', {
                    sessionId: this.sessionId,
                    messageId,
                    responseLength: textResponse.length,
                    parseError: 'JSON parsing failed, treated as text'
                });
            }

            await this.updateWebview();

            await logger.logPerformance('Handle chat message', messageStart, {
                sessionId: this.sessionId,
                messageId,
                messageLength: text.length,
                contextLength: context.length,
                responseProcessed: true
            });

        } catch (error) {
            logger.error('Chat message handling failed', {
                sessionId: this.sessionId,
                messageId,
                error: error.message,
                stack: error.stack,
                duration: Date.now() - messageStart
            });
            
            this.handleError(error);
        }
    }

    handleError(error) {
        const errorInfo = {
            sessionId: this.sessionId,
            errorType: error.name,
            errorMessage: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        };

        if (error.name === 'AbortError') {
            this.messages.push({ role: 'system', content: 'Generation cancelled.' });
            logger.info('Generation cancelled by user', errorInfo);
            this.outputChannel.appendLine('\nGeneration cancelled by user');
        } else {
            logger.error('Chat interface error occurred', errorInfo);
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

    async handleClearContext() {
        logger.info('Clearing context', {
            sessionId: this.sessionId,
            previousFileCount: this.selectedFiles.size
        });
        
        this.selectedFiles.clear();
        await this.updateFileList();
        
        logger.info('Context cleared successfully', {
            sessionId: this.sessionId
        });
    }

    async handleShowStats() {
        try {
            logger.info('Displaying performance statistics', { sessionId: this.sessionId });
            
            const ollamaStats = ollamaService.getStats();
            const sessionDuration = Date.now() - this.startTime;
            const durationFormatted = this.formatDuration(sessionDuration);
            
            const stats = {
                sessionId: this.sessionId,
                messageCount: this.messageCount,
                sessionDuration: durationFormatted,
                ollamaStats,
                contextFileCount: this.selectedFiles.size,
                timestamp: new Date().toISOString()
            };
            
            await this.panel.webview.postMessage({
                type: 'updateStats',
                stats: stats
            });
            
            logger.info('Statistics displayed successfully', { 
                sessionId: this.sessionId,
                stats 
            });
            
        } catch (error) {
            logger.error('Failed to show statistics', {
                sessionId: this.sessionId,
                error: error.message,
                stack: error.stack
            });
        }
    }

    async handleShowLogs() {
        try {
            logger.info('Opening log file', { sessionId: this.sessionId });
            
            const logFile = await logger.getLogFile();
            const document = await vscode.workspace.openTextDocument(logFile);
            await vscode.window.showTextDocument(document, vscode.ViewColumn.Beside);
            
            logger.info('Log file opened successfully', { 
                sessionId: this.sessionId,
                logFile 
            });
            
        } catch (error) {
            logger.error('Failed to show logs', {
                sessionId: this.sessionId,
                error: error.message,
                stack: error.stack
            });
            
            vscode.window.showErrorMessage(`Failed to show logs: ${error.message}`);
        }
    }

    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    // Add dispose method for cleanup
    dispose() {
        logger.info('ChatInterface disposed', {
            sessionId: this.sessionId,
            duration: Date.now() - this.startTime,
            messagesHandled: this.messageCount
        });
        
        if (this.panel) {
            this.panel.dispose();
        }
    }
}

module.exports = new ChatInterface(); 