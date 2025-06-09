# GPT Code Editor - Usage Guide

## Quick Start

1. **Install Ollama**: Download from [ollama.ai](https://ollama.ai)
2. **Pull the model**: `ollama pull llama3.2`
3. **Start Ollama**: `ollama serve`
4. **Install the extension**: Use the `.vsix` file in VS Code
5. **Open chat**: `Ctrl+Shift+P` → "GPT: Open Chat Interface"

## Features Overview

### 🗨️ Chat Interface
- Ask questions about your code
- Get explanations and suggestions
- Request code improvements

### 📁 Context Management
- Add files to provide context to the AI
- Select multiple files for better understanding
- Clear context when switching projects

### 🔧 Code Modifications
- AI can propose code changes
- Review changes in diff view
- Apply, modify, or reject suggestions

### 📋 Copy & Apply
- Copy code snippets to clipboard
- Apply changes directly to files
- Undo changes if needed

## Example Conversations

### Basic Questions
```
You: "What does this function do?"
AI: [Explains the function's purpose and behavior]
```

### Code Generation
```
You: "Create a function to validate email addresses"
AI: [Provides a complete email validation function]
```

### Code Improvement
```
You: "Add error handling to this function"
AI: [Suggests try-catch blocks and error handling]
```

### Refactoring
```
You: "Convert this to use async/await"
AI: [Shows how to refactor promises to async/await]
```

## Tips for Better Results

1. **Provide Context**: Add relevant files before asking questions
2. **Be Specific**: Clear, specific questions get better answers
3. **Review Changes**: Always review AI suggestions before applying
4. **Use Examples**: Show the AI what you're working with

## Troubleshooting

- **No response**: Check if Ollama is running (`ollama serve`)
- **Model not found**: Ensure llama3.2 is installed (`ollama pull llama3.2`)
- **Extension not loading**: Check VS Code version (1.96.0+)

## Keyboard Shortcuts

- `Ctrl+Shift+P` → "GPT: Open Chat Interface" - Open chat
- `Enter` - Send message
- `Escape` - Cancel generation (when loading)

Happy coding! 🚀 