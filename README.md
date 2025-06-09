# GPT Code Editor Extension

A VS Code extension that provides an AI-powered chat interface using Ollama with the llama3.2 model for intelligent code assistance, featuring comprehensive logging and performance monitoring.

## Features

- **Interactive Chat Interface**: Built-in chatbot for discussing code-related queries
- **Context-Aware Responses**: Select files to provide context for better AI responses
- **Code Generation & Modification**: AI can propose code changes with apply/reject options
- **Smart Code Suggestions**: Inline completion support for faster coding
- **Copy to Clipboard**: Easy copying of generated code snippets
- **📊 Performance Monitoring**: Real-time statistics and performance metrics
- **📝 Comprehensive Logging**: Detailed logging to file for debugging and analysis
- **🔍 Health Monitoring**: Automatic health checks and system monitoring
- **📈 Usage Analytics**: Track tokens, requests, and session statistics

## New Enhanced Features

### Logging & Monitoring
- **File Logging**: All activities logged to `/tmp/gpt-code-editor.log`
- **Performance Metrics**: Request/response times, token usage, memory monitoring
- **Session Tracking**: Unique session IDs for better debugging
- **Health Checks**: Automatic Ollama service health monitoring
- **Error Tracking**: Comprehensive error logging with stack traces

### Performance Dashboard
- **Real-time Stats**: View session statistics directly in the chat interface
- **Token Tracking**: Monitor AI token usage and costs
- **Memory Monitoring**: Background memory usage tracking
- **Request Analytics**: Track successful/failed requests

### Enhanced UI
- **Status Bar Integration**: Quick access button in VS Code status bar
- **Statistics Display**: Toggle performance stats in chat interface
- **Log Viewer**: Quick access to logs from within VS Code
- **Context Management**: Improved file selection and context handling

## Prerequisites

1. **Node.js** (Node 20 LTS version recommended)
2. **Visual Studio Code** (version 1.96.0 or higher)
3. **Ollama** installed and running
4. **llama3.2 model** available in Ollama

## Installation

### Step 1: Install Ollama

Visit [Ollama's website](https://ollama.ai) and follow the installation instructions for your operating system.

### Step 2: Install the llama3.2 model

```bash
ollama pull llama3.2
```

### Step 3: Start Ollama service

```bash
ollama serve
```

### Step 4: Install the Extension

#### Option A: From VSIX file
1. Download the latest `.vsix` file from releases
2. Open VS Code
3. Go to Extensions view (`Ctrl+Shift+X`)
4. Click the "..." menu and select "Install from VSIX..."
5. Select the downloaded `.vsix` file

#### Option B: Build from source
```bash
git clone https://github.com/yourusername/gpt-code-editor
cd gpt-code-editor
npm install
npx @vscode/vsce package
```
Then install the generated `.vsix` file as described in Option A.

## Usage

### Opening the Chat Interface

1. **Method 1**: Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) → "GPT: Open Chat Interface"
2. **Method 2**: Click the "GPT Chat" button in the status bar
3. The chat panel will open in a new column

### New Commands Available

- `GPT: Open Chat Interface` - Open the main chat interface
- `GPT: Show Logs` - Open the log file for debugging
- `GPT: Clear Logs` - Clear all logged data

### Performance Monitoring

#### Viewing Statistics
1. Click "Show Stats" button in the chat interface
2. View real-time performance metrics including:
   - Session duration and message count
   - Ollama requests and token usage
   - Average tokens per request
   - Context file count

#### Accessing Logs
1. Click "Show Logs" button in chat interface, or
2. Run `GPT: Show Logs` command
3. View detailed logs including:
   - Request/response times
   - Error details with stack traces
   - Session tracking information
   - Memory usage statistics

### Adding Context Files

1. Click "Add Files" button in the chat interface
2. Select files you want to include as context
3. The AI will use these files to provide more relevant responses

### Chatting with AI

- Type your questions or requests in the input field
- Press Enter or click "Send" to submit
- The AI will respond with helpful information or code suggestions

### Applying Code Changes

When the AI suggests code changes:
1. Review the proposed changes in the chat
2. Click "Apply Changes" to implement them
3. A diff view will show the changes for review
4. Choose to Apply, Modify, or Reject the changes

### Example Prompts

- "Add error handling to this function"
- "Create a new React component for user authentication"
- "Refactor this code to use async/await"
- "Add TypeScript types to this JavaScript file"
- "Explain what this function does"

## Configuration

The extension uses the `llama3.2` model by default. You can modify the model in `src/ollamaService.js` if needed.

## Testing

To test if the extension is working correctly:

```bash
node test-extension.js
```

This will verify:
- Ollama service connection
- Model availability
- Basic response generation

## Troubleshooting

### Common Issues

1. **"Ollama service not available"**
   - Make sure Ollama is installed and running (`ollama serve`)
   - Check if the llama3.2 model is available (`ollama list`)

2. **"Failed to generate response"**
   - Verify Ollama is running on the default port (11434)
   - Check the VS Code Output panel for detailed error messages

3. **Extension not loading**
   - Ensure VS Code version is 1.96.0 or higher
   - Check the Extensions view for any error messages

### Getting Help

- Check the Output panel: View → Output → "GPT Code Editor"
- Enable Developer Tools: Help → Toggle Developer Tools
- Review console logs for detailed error information

## Contributing

We welcome contributions! Please see our contributing guidelines for more details.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
