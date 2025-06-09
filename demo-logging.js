// Demo script to show the logging capabilities
const logger = require('./src/logger');

async function demonstrateLogging() {
    console.log('🚀 GPT Code Editor - Logging Demonstration\n');
    
    try {
        // Initialize logger
        await logger.info('Demo script started', {
            timestamp: new Date().toISOString(),
            demoVersion: '1.0.0'
        });
        
        // Simulate extension activation
        const activationStart = Date.now();
        await logger.info('Extension activation started', {
            version: '0.0.1',
            environment: 'demo'
        });
        
        // Simulate some operations
        await logger.debug('Loading configuration', {
            configFile: 'demo-config.json',
            settings: { theme: 'dark', language: 'en' }
        });
        
        await logger.info('Chat interface initializing', {
            sessionId: 'demo-' + Math.random().toString(36).substring(7),
            features: ['chat', 'codeGen', 'logging']
        });
        
        // Simulate performance monitoring
        await logger.logPerformance('Extension activation', activationStart, {
            componentsLoaded: 5,
            memoryUsage: '45MB'
        });
        
        // Simulate a warning
        await logger.warn('Demo warning example', {
            issue: 'This is just a demonstration',
            severity: 'low'
        });
        
        // Simulate error handling
        try {
            throw new Error('Demo error for logging demonstration');
        } catch (error) {
            await logger.error('Demo error caught', {
                error: error.message,
                stack: error.stack,
                context: 'logging demonstration'
            });
        }
        
        // Show log file location
        const logFile = await logger.getLogFile();
        console.log(`📝 Log file created at: ${logFile}`);
        console.log('📊 Check the log file to see structured JSON logging in action!');
        
        // Read and display recent logs
        const recentLogs = await logger.getRecentLogs(5);
        console.log('\n📋 Recent log entries:');
        console.log('='.repeat(50));
        console.log(recentLogs);
        
    } catch (error) {
        console.error('Demo failed:', error.message);
    }
}

// Run the demonstration
if (require.main === module) {
    demonstrateLogging().then(() => {
        console.log('\n✅ Logging demonstration completed!');
        console.log('💡 In VS Code, these logs help debug and monitor the extension.');
    });
}

module.exports = { demonstrateLogging }; 