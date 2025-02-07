# GPT Code Editor Extension (DeepSeek Model)

A VS Code extension that provides an AI-powered chat interface using the DeepSeek model.

## Features

- **Chat Interface**: A built-in chatbot for discussing code-related queries
- **Full Project Context Awareness**: The model can read all files for better context
- **Smart Responses**: AI-powered responses with code suggestions

## Prerequisites

1. Node.js (Node 20 LTS version recommended)
2. Visual Studio Code
3. Ollama npm package
4. DeepSeek Model installed in Ollama (deepseek-r1)

## Installation

1. Install Ollama:
   ```bash
   npm install -g ollama
   ```

2. Pull the DeepSeek model:
   ```bash
   ollama pull deepseek-r1
   ```

3. Install the extension:
   - Via VS Code Marketplace (coming soon)
   - Or build from source:
     ```bash
     git clone https://github.com/yourusername/gpt-code-editor
     cd gpt-code-editor
     npm install
     npm run build
     ```

## Usage

1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run command: `GPT: Open Chat Interface`
3. Start chatting with the AI about your code!

## Contributing

We welcome contributions! Please see our contributing guidelines for more details.
