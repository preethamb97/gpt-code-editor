// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const ollamaService = require('./src/ollamaService');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	console.log('GPT Code Editor extension is now active');

	// Check Ollama availability on startup
	try {
		const isAvailable = await ollamaService.checkModelAvailability();
		if (!isAvailable) {
			vscode.window.showErrorMessage('Ollama service is not available. Please make sure Ollama is installed and running.');
			return;
		}
		vscode.window.showInformationMessage('GPT Code Editor: Successfully connected to Ollama service');
	} catch (error) {
		vscode.window.showErrorMessage('Failed to connect to Ollama service: ' + error.message);
	}

	// Register Chat Interface Command
	let chatCommand = vscode.commands.registerCommand('gpt-code-editor.openChat', async () => {
		try {
			const chatInterface = require('./src/chatInterface');
			await chatInterface.createChatPanel();
		} catch (error) {
			vscode.window.showErrorMessage('Failed to open chat interface: ' + error.message);
		}
	});

	// Register Generate Code Command
	let generateCommand = vscode.commands.registerCommand('gpt-code-editor.generateCode', async () => {
		try {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('Please open a file first');
				return;
			}

			const promptManager = require('./src/promptManager');
			const currentFile = editor.document.fileName;
			
			// Show input box with prompt format template
			const promptTemplate = `ACTION: [CREATE|MODIFY|DELETE]
FILE: ${currentFile}
DESCRIPTION: 
LOCATION: 
CHANGE_TYPE: [INLINE|BLOCK|APPEND|PREPEND]
CODE:
`;

			const prompt = await vscode.window.showInputBox({
				prompt: 'Enter your code generation prompt following the format:',
				placeHolder: promptTemplate,
				multiline: true
			});
			
			if (prompt) {
				const parsedPrompt = promptManager.parsePrompt(prompt);
				const contextProvider = require('./src/contextProvider');
				const CodeModifier = require('./src/codeModifier');
				
				// Get relevant context based on the description
				const context = await contextProvider.getRelevantContext(
					parsedPrompt.description,
					currentFile
				);
				
				// If it's a MODIFY or CREATE action, get AI suggestions with context
				if (['MODIFY', 'CREATE'].includes(parsedPrompt.action)) {
					const ollamaPrompt = `
						Given this project context:
						${context}
						
						Generate code for:
						${parsedPrompt.description}
						
						Requirements:
						- Action: ${parsedPrompt.action}
						- File: ${parsedPrompt.file}
						${parsedPrompt.changeType ? `- Change Type: ${parsedPrompt.changeType}` : ''}
						${parsedPrompt.location ? `- Location: ${parsedPrompt.location}` : ''}
						
						Response should be only the code, no explanations.`;
						
					const generatedCode = await ollamaService.generateResponse(ollamaPrompt);
					parsedPrompt.code = generatedCode.trim();
				}
				
				// Apply the change and get the change ID
				const changeId = await CodeModifier.applyChange(parsedPrompt);
				
				// Show the diff view and handle user decision
				const changeManager = require('./src/changeManager');
				await changeManager.reviewChange(changeId);
			}
		} catch (error) {
			vscode.window.showErrorMessage('Failed to generate code: ' + error.message);
		}
	});

	// Register Explain Code Command
	let explainCommand = vscode.commands.registerCommand('gpt-code-editor.explainCode', async () => {
		try {
			const editor = vscode.window.activeTextEditor;
			if (editor) {
				const selection = editor.selection;
				const text = editor.document.getText(selection);
				
				if (text) {
					const response = await ollamaService.generateResponse(`Explain this code:\n${text}`);
					const channel = vscode.window.createOutputChannel('GPT Code Editor');
					channel.show();
					channel.appendLine(response);
				} else {
					vscode.window.showInformationMessage('Please select some code to explain.');
				}
			}
		} catch (error) {
			vscode.window.showErrorMessage('Failed to explain code: ' + error.message);
		}
	});

	// Register Smart Update Command
	let smartUpdateCommand = vscode.commands.registerCommand('gpt-code-editor.smartUpdate', async () => {
		try {
			const SmartUpdateManager = require('./src/smartUpdates');
			await SmartUpdateManager.showSuggestionsAndApply();
		} catch (error) {
			vscode.window.showErrorMessage('Failed to process smart updates: ' + error.message);
		}
	});

	// Register Description Command
	let descriptionCommand = vscode.commands.registerCommand('gpt-code-editor.describeCode', async () => {
		try {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('Please open a file first');
				return;
			}

			const selection = editor.selection;
			const code = editor.document.getText(selection);
			
			if (!code) {
				vscode.window.showInformationMessage('Please select code to describe');
				return;
			}

			const codeDescription = require('./src/codeDescription');
			await codeDescription.showInlineDescription(
				code,
				selection
			);
		} catch (error) {
			vscode.window.showErrorMessage('Failed to generate description: ' + error.message);
		}
	});

	// Add after the existing commands but before context.subscriptions.push()
	try {
		const codeSuggestions = require('./src/codeSuggestions');
		codeSuggestions.activate(context);
		vscode.window.showInformationMessage('Code suggestions are now active');
	} catch (error) {
		vscode.window.showErrorMessage('Failed to activate code suggestions: ' + error.message);
	}

	// Add all commands to subscriptions
	context.subscriptions.push(chatCommand);
	context.subscriptions.push(generateCommand);
	context.subscriptions.push(explainCommand);
	context.subscriptions.push(smartUpdateCommand);
	context.subscriptions.push(descriptionCommand);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
