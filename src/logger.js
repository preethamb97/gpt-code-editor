const fs = require('fs-extra');
const path = require('path');
const os = require('os');

class Logger {
    constructor() {
        this.logFile = path.join(os.tmpdir(), 'gpt-code-editor.log');
        this.maxLogSize = 10 * 1024 * 1024; // 10MB
        this.initializeLogger();
    }

    async initializeLogger() {
        try {
            await fs.ensureFile(this.logFile);
            this.log('INFO', 'Logger initialized', { logFile: this.logFile });
        } catch (error) {
            console.error('Failed to initialize logger:', error);
        }
    }

    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const processInfo = {
            pid: process.pid,
            memory: process.memoryUsage(),
            uptime: process.uptime()
        };

        const logEntry = {
            timestamp,
            level,
            message,
            data,
            process: processInfo
        };

        return JSON.stringify(logEntry, null, 2) + '\n';
    }

    async rotateLogIfNeeded() {
        try {
            const stats = await fs.stat(this.logFile);
            if (stats.size > this.maxLogSize) {
                const backupFile = this.logFile + '.backup';
                await fs.move(this.logFile, backupFile, { overwrite: true });
                await fs.ensureFile(this.logFile);
                this.log('INFO', 'Log file rotated', { 
                    oldSize: stats.size, 
                    backupFile 
                });
            }
        } catch (error) {
            console.error('Failed to rotate log:', error);
        }
    }

    async log(level, message, data = null) {
        try {
            await this.rotateLogIfNeeded();
            const formattedMessage = this.formatMessage(level, message, data);
            await fs.appendFile(this.logFile, formattedMessage);
            
            // Also log to console for development
            const consoleMessage = `[${level}] ${message}`;
            switch (level) {
                case 'ERROR':
                    console.error(consoleMessage, data);
                    break;
                case 'WARN':
                    console.warn(consoleMessage, data);
                    break;
                case 'DEBUG':
                    console.debug(consoleMessage, data);
                    break;
                default:
                    console.log(consoleMessage, data);
            }
        } catch (error) {
            console.error('Failed to write log:', error);
        }
    }

    info(message, data = null) {
        return this.log('INFO', message, data);
    }

    warn(message, data = null) {
        return this.log('WARN', message, data);
    }

    error(message, data = null) {
        return this.log('ERROR', message, data);
    }

    debug(message, data = null) {
        return this.log('DEBUG', message, data);
    }

    async logPerformance(operation, startTime, data = null) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        await this.log('PERF', `${operation} completed`, {
            duration: `${duration}ms`,
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
            ...data
        });
        return duration;
    }

    async getLogFile() {
        return this.logFile;
    }

    async getRecentLogs(lines = 100) {
        try {
            const content = await fs.readFile(this.logFile, 'utf8');
            const logLines = content.trim().split('\n');
            return logLines.slice(-lines).join('\n');
        } catch (error) {
            this.error('Failed to read recent logs', error);
            return 'Failed to read logs';
        }
    }

    async clearLogs() {
        try {
            await fs.writeFile(this.logFile, '');
            this.info('Log file cleared');
        } catch (error) {
            this.error('Failed to clear logs', error);
        }
    }
}

module.exports = new Logger(); 