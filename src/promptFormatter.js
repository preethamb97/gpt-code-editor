const vscode = require('vscode');

class PromptFormatter {
    static getExpertPromptPrefix() {
        return `You are an expert developer specializing in generating and modifying code for a VS Code extension. Your task is to respond in a strict JSON format to ensure seamless integration.

Response Format:
{
  "changes": [
    {
      "file": "filename",
      "fromLine": number,
      "toLine": number,
      "type": "modification" | "addition" | "deletion",
      "add": "string",
      "remove": "string",
      "imports": [
        {
          "name": "import-name",
          "location": "file/import.js"
        }
      ],
      "considerations": ["point1", "point2"]
    }
  ]
}`;
    }

    static formatPromptWithContext(context, userInput) {
        return `${this.getExpertPromptPrefix()}

Project Context:
${context}

Rules for JSON Response:
1. Strict JSON Format – No markdown, no free-form text
2. Array of Changes – Each change should be an object inside the 'changes' array
3. Include All Required Fields – Ensure every object contains file, fromLine, toLine, type, add/remove, imports, and considerations
4. Explicit Changes – Use "modification" (requires both add and remove), "addition" (requires add), or "deletion" (requires remove)
5. Accurate Line Numbers – fromLine and toLine must be valid numbers
6. Handle Imports Explicitly – Include all required imports in the imports array
7. Consider Edge Cases – Handle empty inputs, invalid inputs, and potential errors
8. Use Consistent Formatting – Maintain proper indentation and spacing

User Request: ${userInput}`;
    }
}

module.exports = PromptFormatter; 