const vscode = require('vscode');

class OllamaService {
    constructor() {
        this.model = 'llama3.2';
        this.ollama = null;
        this.outputChannel = null;
    }

    async initialize() {
        try {
            const ollamaModule = await import('ollama');
            this.ollama = ollamaModule.default;
            // Initialize output channel if not already done
            if (!this.outputChannel) {
                const vscode = require('vscode');
                this.outputChannel = vscode.window.createOutputChannel('GPT Code Editor');
            }
            return true;
        } catch (error) {
            console.error('Failed to initialize Ollama:', error);
            return false;
        }
    }

    async checkModelAvailability() {
        try {
            if (!this.ollama) {
                await this.initialize();
            }
            await this.ollama.list();
            return true;
        } catch (error) {
            console.error('Ollama service not available:', error);
            return false;
        }
    }

    async generateResponse(prompt, signal) {
        try {
            if (!this.ollama) {
                await this.initialize();
            }

            const expertPromptPrefix = `You are an expert developer specializing in VS Code extension development. Analyze the request and provide a detailed response following this format:

            {
                "changes": [
                    {
                        "file": "filename",
                        "fromLine": number,
                        "toLine": number,
                        "type": "modification" | "addition" | "deletion",
                        "add": "string",
                        "remove": "string",
                        "imports": [
                            {
                                "name": "import-name",
                                "location": "file/import.js"
                            }
                        ],
                        "considerations": [
                            "Important technical considerations",
                            "Best practices to follow"
                        ]
                    }
                ]
            }`;

            const fullPrompt = `${expertPromptPrefix}\n\nUser Request: ${prompt}`;
            this.outputChannel.appendLine('Generating response for prompt:');
            this.outputChannel.appendLine(fullPrompt);

            const response = await this.ollama.generate({
                model: 'llama3.2',
                prompt: fullPrompt,
                signal: signal
            });

            this.outputChannel.appendLine('\nResponse received:');
            this.outputChannel.appendLine(response);

            return response;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw error;
            }
            this.outputChannel.appendLine(`Error generating response: ${error.message}`);
            throw new Error(`Failed to generate response: ${error.message}`);
        }
    }

    async generateResponseWithContext(prompt, searchTerm = '') {
        try {
            if (!this.ollama) {
                console.log('Ollama generateResponseWithContext initialize', this.ollama);
                await this.initialize();
            }

            const projectContext = require('./projectContext');
            const context = await projectContext.getContextForPrompt(searchTerm);

            console.log('Ollama generateResponseWithContext context', context);
            const response = await this.ollama.generate({
                model: this.model,
                prompt: `${context}\nUser request: ${prompt}\nPlease provide a response that takes into account the project context shown above.`,
                stream: false
            });
            console.log('Ollama generateResponseWithContext response', response);
            return response.response;
        } catch (error) {
            console.error('Error generating response:', error);
            throw error;
        }
    }
}

module.exports = new OllamaService(); 