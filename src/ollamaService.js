const logger = require('./logger');

class OllamaService {
    constructor() {
        this.model = 'llama3.2';
        this.ollama = null;
        this.outputChannel = null;
        this.requestCount = 0;
        this.totalTokens = 0;
        this.lastHealthCheck = null;
        
        logger.info('OllamaService initialized', {
            model: this.model,
            timestamp: new Date().toISOString()
        });
    }

    async initialize() {
        const startTime = Date.now();
        
        try {
            logger.info('Initializing Ollama service');
            
            const ollamaModule = await import('ollama');
            this.ollama = ollamaModule.default;
            
            // Initialize output channel if not already done
            if (!this.outputChannel) {
                this.outputChannel = require('vscode').window.createOutputChannel('GPT Code Editor');
            }
            
            // Perform health check
            await this.performHealthCheck();
            
            await logger.logPerformance('Ollama service initialization', startTime);
            logger.info('Ollama service initialized successfully');
            
            return true;
        } catch (error) {
            logger.error('Failed to initialize Ollama service', {
                error: error.message,
                stack: error.stack
            });
            console.error('Failed to initialize Ollama:', error);
            return false;
        }
    }

    async performHealthCheck() {
        try {
            logger.debug('Performing Ollama health check');
            
            const models = await this.ollama.list();
            const availableModels = models.models?.map(m => m.name) || [];
            const isModelAvailable = availableModels.some(name => name.includes(this.model));
            
            this.lastHealthCheck = {
                timestamp: new Date().toISOString(),
                available: true,
                models: availableModels,
                targetModelAvailable: isModelAvailable
            };
            
            logger.info('Ollama health check completed', this.lastHealthCheck);
            
            if (!isModelAvailable) {
                logger.warn(`Target model '${this.model}' not available`, {
                    availableModels,
                    targetModel: this.model
                });
            }
            
            return this.lastHealthCheck;
            
        } catch (error) {
            this.lastHealthCheck = {
                timestamp: new Date().toISOString(),
                available: false,
                error: error.message
            };
            
            logger.error('Ollama health check failed', this.lastHealthCheck);
            throw error;
        }
    }

    async checkModelAvailability() {
        try {
            if (!this.ollama) {
                await this.initialize();
            }
            
            const healthCheck = await this.performHealthCheck();
            return healthCheck.available && healthCheck.targetModelAvailable;
            
        } catch (error) {
            logger.error('Model availability check failed', {
                error: error.message,
                model: this.model
            });
            console.error('Ollama service not available:', error);
            return false;
        }
    }

    async generateResponse(prompt, signal) {
        const requestId = ++this.requestCount;
        const startTime = Date.now();
        
        try {
            logger.info('Starting response generation', {
                requestId,
                promptLength: prompt.length,
                model: this.model,
                hasSignal: !!signal
            });

            if (!this.ollama) {
                await this.initialize();
            }

            // Check if this is a code-related request
            const isCodeRequest = this.isCodeRequest(prompt);
            
            let fullPrompt;
            if (isCodeRequest) {
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
                fullPrompt = `${expertPromptPrefix}\n\nUser Request: ${prompt}`;
            } else {
                // For regular chat, just use the prompt as-is
                fullPrompt = `You are a helpful AI assistant specializing in software development. Please provide a clear and helpful response to the following question:\n\n${prompt}`;
            }

            logger.debug('Generated full prompt', {
                requestId,
                isCodeRequest,
                fullPromptLength: fullPrompt.length
            });

            this.outputChannel.appendLine('Generating response for prompt:');
            this.outputChannel.appendLine(fullPrompt);

            const response = await this.ollama.generate({
                model: this.model,
                prompt: fullPrompt,
                signal: signal
            });

            // Log response metrics
            const responseLength = response.response?.length || 0;
            this.totalTokens += Math.ceil(responseLength / 4); // Rough token estimation
            
            await logger.logPerformance('Response generation', startTime, {
                requestId,
                isCodeRequest,
                promptLength: fullPrompt.length,
                responseLength,
                estimatedTokens: Math.ceil(responseLength / 4),
                totalRequests: this.requestCount,
                cumulativeTokens: this.totalTokens
            });

            this.outputChannel.appendLine('\nResponse received:');
            this.outputChannel.appendLine(JSON.stringify(response, null, 2));

            logger.info('Response generation completed successfully', {
                requestId,
                responseLength,
                duration: Date.now() - startTime
            });

            return response;
            
        } catch (error) {
            if (error.name === 'AbortError') {
                logger.info('Response generation aborted by user', {
                    requestId,
                    duration: Date.now() - startTime
                });
                throw error;
            }
            
            logger.error('Response generation failed', {
                requestId,
                error: error.message,
                stack: error.stack,
                model: this.model,
                promptLength: prompt.length
            });
            
            this.outputChannel.appendLine(`Error generating response: ${error.message}`);
            throw new Error(`Failed to generate response: ${error.message}`);
        }
    }

    isCodeRequest(prompt) {
        const codeKeywords = [
            'create', 'add', 'modify', 'change', 'update', 'fix', 'implement', 
            'write', 'generate', 'code', 'function', 'class', 'method', 'file',
            'delete', 'remove', 'refactor'
        ];
        
        const lowerPrompt = prompt.toLowerCase();
        const isCode = codeKeywords.some(keyword => lowerPrompt.includes(keyword));
        
        logger.debug('Code request detection', {
            prompt: prompt.substring(0, 100) + '...',
            isCodeRequest: isCode,
            matchedKeywords: codeKeywords.filter(k => lowerPrompt.includes(k))
        });
        
        return isCode;
    }

    getStats() {
        return {
            model: this.model,
            requestCount: this.requestCount,
            totalTokens: this.totalTokens,
            lastHealthCheck: this.lastHealthCheck,
            averageTokensPerRequest: this.requestCount > 0 ? Math.round(this.totalTokens / this.requestCount) : 0
        };
    }

    async generateResponseWithContext(prompt, searchTerm = '') {
        const startTime = Date.now();
        
        try {
            logger.info('Generating response with context', {
                promptLength: prompt.length,
                searchTerm,
                model: this.model
            });

            if (!this.ollama) {
                logger.debug('Ollama not initialized, initializing now');
                await this.initialize();
            }

            const projectContext = require('./projectContext');
            const context = await projectContext.getContextForPrompt(searchTerm);

            logger.debug('Project context retrieved', {
                contextLength: context.length,
                searchTerm
            });

            const response = await this.ollama.generate({
                model: this.model,
                prompt: `${context}\nUser request: ${prompt}\nPlease provide a response that takes into account the project context shown above.`,
                stream: false
            });
            
            await logger.logPerformance('Generate response with context', startTime, {
                contextLength: context.length,
                promptLength: prompt.length,
                responseLength: response.response?.length || 0
            });

            logger.info('Response with context generated successfully');
            return response.response;
            
        } catch (error) {
            logger.error('Failed to generate response with context', {
                error: error.message,
                stack: error.stack,
                promptLength: prompt.length,
                searchTerm
            });
            console.error('Error generating response:', error);
            throw error;
        }
    }
}

module.exports = new OllamaService(); 