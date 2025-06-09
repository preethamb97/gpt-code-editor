// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const chatInterface = require('./src/chatInterface');
const logger = require('./src/logger');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	const startTime = Date.now();
	
	try {
		await logger.info('GPT Code Editor extension activation started', {
			version: '0.0.1',
			vscodeVersion: vscode.version,
			workspaceFolders: vscode.workspace.workspaceFolders?.map(f => f.uri.path)
		});

		console.log('GPT Code Editor is now active');

		// Register the main chat command
		let openChatCommand = vscode.commands.registerCommand('gpt-code-editor.openChat', async () => {
			const commandStartTime = Date.now();
			try {
				await logger.info('Opening chat interface');
				await chatInterface.createChatPanel();
				await logger.logPerformance('Open chat interface', commandStartTime);
			} catch (error) {
				await logger.error('Failed to open chat interface', {
					error: error.message,
					stack: error.stack
				});
				vscode.window.showErrorMessage(`Failed to open chat: ${error.message}`);
			}
		});

		// Register command to show logs
		let showLogsCommand = vscode.commands.registerCommand('gpt-code-editor.showLogs', async () => {
			try {
				await logger.info('Showing logs command executed');
				const logFile = await logger.getLogFile();
				const document = await vscode.workspace.openTextDocument(logFile);
				await vscode.window.showTextDocument(document);
			} catch (error) {
				await logger.error('Failed to show logs', error);
				vscode.window.showErrorMessage(`Failed to show logs: ${error.message}`);
			}
		});

		// Register command to clear logs
		let clearLogsCommand = vscode.commands.registerCommand('gpt-code-editor.clearLogs', async () => {
			try {
				const result = await vscode.window.showWarningMessage(
					'Are you sure you want to clear all logs?',
					{ modal: true },
					'Yes',
					'No'
				);
				
				if (result === 'Yes') {
					await logger.clearLogs();
					vscode.window.showInformationMessage('Logs cleared successfully');
				}
			} catch (error) {
				await logger.error('Failed to clear logs', error);
				vscode.window.showErrorMessage(`Failed to clear logs: ${error.message}`);
			}
		});

		// Register status bar item for quick access
		const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
		statusBarItem.text = "$(comment-discussion) GPT Chat";
		statusBarItem.command = 'gpt-code-editor.openChat';
		statusBarItem.tooltip = 'Open GPT Code Editor Chat';
		statusBarItem.show();

		// Add subscriptions
		context.subscriptions.push(
			openChatCommand,
			showLogsCommand,
			clearLogsCommand,
			statusBarItem
		);

		// Monitor extension health
		setupHealthMonitoring(context);

		await logger.logPerformance('Extension activation', startTime, {
			commandsRegistered: 3,
			subscriptions: context.subscriptions.length
		});

		await logger.info('GPT Code Editor extension activated successfully');

	} catch (error) {
		await logger.error('Extension activation failed', {
			error: error.message,
			stack: error.stack
		});
		vscode.window.showErrorMessage(`GPT Code Editor failed to activate: ${error.message}`);
		throw error;
	}
}

function setupHealthMonitoring(context) {
	// Monitor memory usage every 5 minutes
	const memoryMonitor = setInterval(async () => {
		const memUsage = process.memoryUsage();
		await logger.debug('Memory usage check', {
			heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
			heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
			external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
			rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
		});
	}, 5 * 60 * 1000); // 5 minutes

	// Clean up on deactivation
	context.subscriptions.push({
		dispose: () => clearInterval(memoryMonitor)
	});
}

// This method is called when your extension is deactivated
async function deactivate() {
	try {
		await logger.info('GPT Code Editor extension deactivation started');
		
		// Clean up resources
		if (chatInterface.dispose) {
			await chatInterface.dispose();
		}

		await logger.info('GPT Code Editor extension deactivated successfully');
	} catch (error) {
		await logger.error('Extension deactivation failed', {
			error: error.message,
			stack: error.stack
		});
	}
}

module.exports = {
	activate,
	deactivate
}
