const vscode = require('vscode');

class ChatWebviewPanel {
    constructor(context) {
        this.context = context;
        this.panel = null;
        this.messages = [];
    }

    createOrShow() {
        if (this.panel) {
            this.panel.reveal();
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'gptChat',
            'GPT Chat',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.panel.webview.html = this.getWebviewContent();

        this.panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'sendMessage':
                        await this.handleUserMessage(message.text);
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );

        this.panel.onDidDispose(
            () => {
                this.panel = null;
            },
            null,
            this.context.subscriptions
        );
    }

    async handleUserMessage(text) {
        try {
            // Add user message to chat
            this.messages.push({ role: 'user', content: text });
            this.updateWebview();

            // Get AI response
            const ollamaService = require('./ollamaService');
            const response = await ollamaService.generateResponse(text);

            // Add AI response to chat
            this.messages.push({ role: 'assistant', content: response });
            this.updateWebview();
        } catch (error) {
            vscode.window.showErrorMessage('Failed to get response: ' + error.message);
        }
    }

    updateWebview() {
        if (this.panel) {
            this.panel.webview.html = this.getWebviewContent();
        }
    }

    getWebviewContent() {
        const messageHtml = this.messages.map(msg => `
            <div class="${msg.role}-message">
                <strong>${msg.role === 'user' ? 'You' : 'AI'}:</strong>
                <pre>${this.escapeHtml(msg.content)}</pre>
            </div>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { padding: 10px; }
                    .chat-container { 
                        display: flex;
                        flex-direction: column;
                        height: calc(100vh - 100px);
                    }
                    .messages {
                        flex: 1;
                        overflow-y: auto;
                        margin-bottom: 20px;
                    }
                    .user-message { margin: 10px 0; }
                    .assistant-message { 
                        margin: 10px 0;
                        background: #1e1e1e;
                        padding: 10px;
                        border-radius: 5px;
                    }
                    pre {
                        white-space: pre-wrap;
                        margin: 5px 0;
                    }
                    .input-container {
                        display: flex;
                        gap: 10px;
                    }
                    #userInput {
                        flex: 1;
                        padding: 8px;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                        background: #2d2d2d;
                        color: #fff;
                    }
                    button {
                        padding: 8px 15px;
                        background: #0e639c;
                        border: none;
                        border-radius: 4px;
                        color: white;
                        cursor: pointer;
                    }
                    button:hover { background: #1177bb; }
                </style>
            </head>
            <body>
                <div class="chat-container">
                    <div class="messages">
                        ${messageHtml}
                    </div>
                    <div class="input-container">
                        <input type="text" id="userInput" placeholder="Type your message...">
                        <button onclick="sendMessage()">Send</button>
                    </div>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    document.getElementById('userInput').addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            sendMessage();
                        }
                    });

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
                </script>
            </body>
            </html>
        `;
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

module.exports = ChatWebviewPanel; 