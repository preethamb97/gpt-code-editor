# VS Code GPT Editor Extension (DeepSeek Model)

## Project Overview

This project aims to develop a VS Code extension that integrates the deepseek-r1 model for AI-powered code assistance using the ollama npm package. The extension will provide the following features:

### Key Features
- **Chat Interface**: A built-in chatbot for discussing code-related queries
- **Code Suggestions**: AI-powered inline code suggestions
- **Prompt Button**: Users can generate code using custom prompts
- **Full Project Context Awareness**: The model can read all files and update them as needed
- **Smart Code Updates**: Ability to add or modify code wherever required in each file
- **Accept/Reject Changes**: Users can approve or discard AI-generated code
- **Description Button**: Provides an explanation of AI-generated code before adding it

## Prerequisites

Before starting, ensure you have the following installed:
- Node.js (Node 20 LTS version recommended)
- Visual Studio Code
- Ollama npm package
- DeepSeek Model installed in Ollama (deepseek-r1)

## Getting Started

For a comprehensive guide on VS Code extension development, refer to the official documentation:
[Your First Extension Guide](https://code.visualstudio.com/api/get-started/your-first-extension)

This guide covers:
- Setting up your development environment
- Creating your first extension
- Running and debugging extensions
- Publishing extensions to the VS Code Marketplace

## Project Plan

### 1. Initialize the VS Code Extension
- Use `yo code` or manually set up the project structure
- Create `package.json`, `extension.ts`, and vscode configuration files
- Install dependencies: `npm install vscode ollama fs-extra`

### 2. Set Up Ollama Integration
- Install and configure ollama
- Ensure DeepSeek model is available (`ollama run deepseek-r1` for testing)
- Create a helper function to send prompts to DeepSeek

### 3. Implement Chat Interface
- Create a webview panel in VS Code for chat interactions
- Display conversation history and allow user input
- Handle sending messages to DeepSeek and displaying responses

### 4. Implement Code Suggestions
- Use DeepSeek to suggest code based on user input
- Show inline suggestions in the editor
- Provide an option to accept/reject suggestions

### 5. Implement Prompt Button
- Add a VS Code command to trigger a prompt input
- Send user input to DeepSeek and insert the generated code at the cursor position

### 5.1 Prompt Format Guidelines
You are an expert developer specializing in generating and modifying code for a VS Code extension. Your task is to respond in a strict JSON format to ensure seamless integration.

## Response Format
```json
{
  "changes": [
    {
      "file": "filename",
      "lineNumber": number,
      "type": "modification" | "addition" | "deletion",
      "code": "string",
      "imports": [
        {
          "name": "import-name",
          "location": "file/import.js"
        }
      ],
      "considerations": ["point1", "point2"]
    }
  ]
}
```

## Project Context

### Rules for JSON Response:
1. **Strict JSON Format** – No markdown, no free-form text.
2. **Array of Changes** – Each change should be an object inside the `changes` array.
3. **Include All Required Fields** – Ensure every object contains `file`, `lineNumber`, `type`, `code`, `imports`, and `considerations`.
4. **Explicit Changes** – Clearly specify whether a change is an `addition`, `modification`, or `deletion`.
5. **Accurate Line Numbers** – Ensure correctness with file names and line numbers.
6. **Imports Handling** – If new imports are required, they must be explicitly included in the `imports` array.
7. **Edge Cases Handling** – When modifying or generating code, consider potential edge cases such as:
   - Handling empty inputs
   - Handling invalid inputs
   - Performance considerations
   - Security concerns (e.g., user input sanitization)
   - Compatibility with different JavaScript environments (Node.js, browser, ES modules, etc.)
8. **Consistent Formatting** – Ensure proper indentation and spacing for code readability.

This ensures seamless integration and a structured approach to generating and modifying code in the VS Code extension.


This structured format enables:
- Clear accept/reject dialogs with change descriptions
- Precise code modifications
- Automatic file creation if needed
- Line-specific changes in existing files
- Multiple change types (inline, block, append, prepend)

### 6. Enable Full Project Context Awareness
- Read all files in the project
- Pass relevant code snippets to DeepSeek for context-aware suggestions
- Optimize the prompt for accuracy

### 7. Implement Smart Code Updates
- Analyze code structure and suggest new additions
- Insert or modify code where needed
- Show a diff view for changes before applying them

### 8. Accept/Reject Changes Feature
- Allow users to approve or discard AI-suggested code
- Integrate with VS Code's diff viewer

### 9. Add Description Button
- Generate explanations for suggested changes
- Display explanations in a tooltip or sidebar before applying the code

### 10. Testing and Debugging
- Test extension features in a real VS Code environment
- Fix issues and optimize performance