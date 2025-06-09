# GPT Code Editor Extension

A VS Code extension that provides an AI-powered chat interface using Ollama with the llama3.2 model for intelligent code assistance.

## Features

- **Interactive Chat Interface**: Built-in chatbot for discussing code-related queries
- **Context-Aware Responses**: Select files to provide context for better AI responses
- **Code Generation & Modification**: AI can propose code changes with apply/reject options
- **Smart Code Suggestions**: Inline completion support for faster coding
- **Copy to Clipboard**: Easy copying of generated code snippets

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

1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run command: `GPT: Open Chat Interface`
3. The chat panel will open in a new column

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
