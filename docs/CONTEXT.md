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
- Prompts should follow a specific format for the extension to properly handle code generation and modifications
- Format structure for code changes:
  ```
  ACTION: [CREATE|MODIFY|DELETE]
  FILE: [filename with path]
  DESCRIPTION: [brief description of the change]
  LOCATION: [line number or "end" for appending] (only for MODIFY)
  CHANGE_TYPE: [INLINE|BLOCK|APPEND|PREPEND]
  CODE:
  ```language
  // Your code here
  ```
  ```

- Example for creating a new file:
  ```
  ACTION: CREATE
  FILE: src/utils/add.js
  DESCRIPTION: Function to add two numbers
  CHANGE_TYPE: BLOCK
  CODE:
  ```javascript
  function addNumbers(num1, num2) {
      return Number(num1) + Number(num2);
  }
  
  module.exports = addNumbers;
  ```
  ```

- Example for modifying existing code:
  ```
  ACTION: MODIFY
  FILE: src/utils/math.js
  DESCRIPTION: Adding multiplication function
  LOCATION: 25
  CHANGE_TYPE: APPEND
  CODE:
  ```javascript
  function multiply(a, b) {
      return a * b;
  }
  ```
  ```

- Example for deleting code:
  ```
  ACTION: DELETE
  FILE: src/utils/deprecated.js
  DESCRIPTION: Remove deprecated utility functions
  LOCATION: 15-30
  ```

The prompt format supports:
- `ACTION`: Specifies whether to create, modify, or delete code
- `FILE`: Target file path
- `DESCRIPTION`: Clear explanation of the change for the accept/reject dialog
- `LOCATION`: For modifications, specifies where to insert/modify code
- `CHANGE_TYPE`: How to apply the change:
  - `INLINE`: Replace specific lines
  - `BLOCK`: Complete file content
  - `APPEND`: Add after specified location
  - `PREPEND`: Add before specified location
- `CODE`: The actual code to be added or modified

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