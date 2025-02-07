// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const chatInterface = require('./src/chatInterface');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	console.log('GPT Code Editor is now active');

	let openChatCommand = vscode.commands.registerCommand('gpt-code-editor.openChat', async () => {
		try {
			await chatInterface.createChatPanel();
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to open chat: ${error.message}`);
		}
	});

	context.subscriptions.push(openChatCommand);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
