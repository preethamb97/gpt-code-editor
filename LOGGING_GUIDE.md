# GPT Code Editor - Comprehensive Logging Guide

## Overview

The GPT Code Editor extension includes comprehensive logging capabilities that track every aspect of the extension's operation. All logs are written to a single file for easy debugging and performance analysis.

## Log File Location

**Primary Log File**: `/tmp/gpt-code-editor.log`
**Backup Log File**: `/tmp/gpt-code-editor.log.backup` (created when primary log reaches 10MB)

## What Gets Logged

### 1. Extension Lifecycle Events

```json
{
  "timestamp": "2024-01-20T10:30:00.000Z",
  "level": "INFO",
  "message": "GPT Code Editor extension activation started",
  "data": {
    "version": "0.0.1",
    "vscodeVersion": "1.96.0",
    "workspaceFolders": ["/path/to/workspace"]
  },
  "process": {
    "pid": 12345,
    "memory": {...},
    "uptime": 123.45
  }
}
```

### 2. Chat Interface Operations

#### Session Management
- **Session Creation**: Unique session ID, timestamp
- **Panel Creation**: Webview setup, configuration
- **Panel Disposal**: Session duration, messages handled

#### Message Processing
- **User Messages**: Message ID, content length, context file count
- **AI Responses**: Response type (JSON/text), processing time
- **Code Changes**: Change type, file affected, success/failure

### 3. Ollama Service Monitoring

#### Health Checks
```json
{
  "timestamp": "2024-01-20T10:30:15.000Z",
  "level": "INFO",
  "message": "Ollama health check completed",
  "data": {
    "timestamp": "2024-01-20T10:30:15.000Z",
    "available": true,
    "models": ["llama3.2:latest", "phi3:latest"],
    "targetModelAvailable": true
  }
}
```

#### Request/Response Tracking
- **Request Initiation**: Request ID, prompt length, model used
- **Code Detection**: Whether request is code-related, matched keywords
- **Response Generation**: Duration, token estimates, success/failure
- **Cancellation**: User-initiated aborts, cleanup

### 4. Performance Metrics

#### Memory Monitoring (every 5 minutes)
```json
{
  "timestamp": "2024-01-20T10:35:00.000Z",
  "level": "DEBUG",
  "message": "Memory usage check",
  "data": {
    "heapUsed": "45MB",
    "heapTotal": "67MB",
    "external": "12MB",
    "rss": "89MB"
  }
}
```

#### Operation Performance
- **Extension Activation**: Startup time, commands registered
- **Chat Panel Creation**: Setup duration, components initialized
- **Message Handling**: Processing time per message type
- **Context Retrieval**: File reading time, context size

### 5. Error Tracking

#### Comprehensive Error Logging
```json
{
  "timestamp": "2024-01-20T10:30:30.000Z",
  "level": "ERROR",
  "message": "Chat message handling failed",
  "data": {
    "sessionId": "abc123",
    "messageId": "msg_1705747830000_xyz789",
    "error": "Connection refused",
    "stack": "Error: Connection refused\n    at ...",
    "duration": 1250
  }
}
```

#### Error Types Tracked
- **Extension Activation Failures**
- **Ollama Connection Issues**
- **Chat Interface Errors**
- **Code Processing Failures**
- **File System Operations**

### 6. User Activity Analytics

#### Session Statistics
- **Messages Sent**: Count, average length
- **Context Usage**: Files selected, total size
- **Feature Usage**: Commands executed, buttons clicked
- **Response Types**: Code vs. chat responses

#### Performance Analytics
- **Token Usage**: Total tokens, average per request
- **Request Success Rate**: Successful vs. failed requests
- **Response Times**: Average, min, max durations

## Log Levels

### INFO
- Normal operation events
- Successful operations
- Status updates

### DEBUG  
- Detailed operation information
- Performance data
- Context information

### WARN
- Non-critical issues
- Fallback operations
- Missing optional components

### ERROR
- Failed operations
- Exception details
- Critical errors

### PERF
- Performance measurements
- Operation durations
- Resource usage

## Accessing Logs

### Via VS Code Commands
1. **Show Logs**: `Ctrl+Shift+P` → "GPT: Show Logs"
2. **Clear Logs**: `Ctrl+Shift+P` → "GPT: Clear Logs"

### Via Chat Interface
1. Click "Show Logs" button in chat panel
2. Log file opens in VS Code editor

### Direct File Access
```bash
# View recent logs
tail -f /tmp/gpt-code-editor.log

# Search for errors
grep "ERROR" /tmp/gpt-code-editor.log

# View specific session
grep "sessionId.*abc123" /tmp/gpt-code-editor.log
```

## Log Analysis Examples

### Finding Performance Issues
```bash
# Find slow operations (>1000ms)
grep -E '"duration":\s*"[1-9][0-9]{3,}ms"' /tmp/gpt-code-editor.log

# Memory usage over time
grep "Memory usage check" /tmp/gpt-code-editor.log | tail -10
```

### Debugging Errors
```bash
# All errors in chronological order
grep '"level":"ERROR"' /tmp/gpt-code-editor.log

# Specific session errors
grep -A 5 -B 5 '"sessionId":"abc123".*ERROR' /tmp/gpt-code-editor.log
```

### Usage Analytics
```bash
# Count messages processed
grep "Processing chat message" /tmp/gpt-code-editor.log | wc -l

# Token usage summary
grep "totalTokens" /tmp/gpt-code-editor.log | tail -1
```

## Privacy & Security

### What is NOT logged
- **Actual message content** (only length/metadata)
- **File contents** (only paths and sizes)  
- **Sensitive user data**
- **API keys or credentials**

### Data Retention
- **Automatic Rotation**: Logs rotate at 10MB
- **Local Storage**: All logs stored locally only
- **Manual Cleanup**: Use "Clear Logs" command

## Troubleshooting with Logs

### Common Issues

1. **Extension Won't Start**
   ```bash
   grep "activation" /tmp/gpt-code-editor.log | tail -5
   ```

2. **Ollama Connection Problems**
   ```bash
   grep "Ollama.*failed\|health check failed" /tmp/gpt-code-editor.log
   ```

3. **Chat Interface Issues**
   ```bash
   grep "Chat.*error\|webview.*error" /tmp/gpt-code-editor.log
   ```

4. **Performance Problems**
   ```bash
   grep "PERF.*[5-9][0-9]{3,}ms" /tmp/gpt-code-editor.log
   ```

## Log Configuration

The logging system is automatically configured with:
- **Max file size**: 10MB before rotation
- **Retention**: Current + 1 backup file
- **Format**: Structured JSON for easy parsing
- **Levels**: All levels enabled (DEBUG, INFO, WARN, ERROR, PERF)

This comprehensive logging system ensures that every aspect of the extension's operation is tracked, making debugging and performance optimization straightforward. 