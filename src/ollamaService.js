const vscode = require('vscode');

class OllamaService {
    constructor() {
        this.model = 'deepseek-r1:7b';
        this.ollama = null;
    }

    async initialize() {
        try {
            const ollamaModule = await import('ollama');
            this.ollama = ollamaModule.default;
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

    async generateResponse(prompt) {
        try {
            if (!this.ollama) {
                console.log('Ollama generateResponse initialize', this.ollama);
                await this.initialize();
            }
            console.log('Ollama generateResponse prompt', prompt);
            const response = await this.ollama.generate({
                model: this.model,
                prompt: prompt,
                stream: false
            });
            console.log('Ollama generateResponse response', response);
            return response.response;
        } catch (error) {
            console.error('Error generating response:', error);
            throw error;
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