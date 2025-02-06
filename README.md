# GPT Code Editor

A powerful VS Code extension that integrates the DeepSeek model via Ollama for AI-powered code assistance. This extension enhances your coding experience with intelligent suggestions, code generation, and project-wide context awareness.

## Features

- 🤖 **AI-Powered Chat Interface**: Discuss code and get intelligent responses
- ✨ **Smart Code Suggestions**: Real-time code completion and suggestions
- 🔄 **Code Generation**: Generate code using natural language prompts
- 📝 **Code Explanations**: Get instant explanations for selected code
- 🔍 **Project Context Awareness**: AI understands your entire project structure
- 🛠️ **Smart Updates**: Intelligent code modification suggestions
- ✅ **Review Changes**: Preview and approve/reject AI-generated changes

## Prerequisites

- Node.js (v20 LTS recommended)
- Visual Studio Code (v1.96.0 or higher)
- Ollama installed locally
- DeepSeek model installed in Ollama (`deepseek-r1`)

## Installation

1. Install Ollama:
   ```bash
   # macOS/Linux
   curl https://ollama.ai/install.sh | sh
   
   # Windows
   # Download from https://ollama.ai/download
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
2. Available commands:
   - `GPT: Open Chat Interface`
   - `GPT: Generate Code`
   - `GPT: Explain Code`
   - `GPT: Analyze and Suggest Code Updates`
   - `GPT: Describe Selected Code`

## Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create your feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. Push to the branch:
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request

### Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Open in VS Code:
   ```bash
   code .
   ```
4. Press F5 to start debugging

### Project Structure

- `src/`: Source code files
- `test/`: Test files
- `docs/`: Documentation
- `.vscode/`: VS Code specific settings

## License

This project is licensed under the MIT License - see below for details:
