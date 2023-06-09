// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';


// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	let outputChannel = vscode.window.createOutputChannel("Acadnet Checker");

	const provider = new CheckerViewProvider(context.extensionUri, outputChannel);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(CheckerViewProvider.viewType, provider));
}

// This method is called when your extension is deactivated
export function deactivate() {}

class CheckerViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'checker-view';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _outputChannel: vscode.OutputChannel
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'checkProblem':
					{
						this.checkProblem();
						break;
					}
			}
		});
	}

	private checkProblem() {
		this._outputChannel.appendLine("Checking problem...");

		// check if there is a main.cpp
		if (!vscode.workspace.workspaceFolders) {
			this._outputChannel.appendLine("No workspace folders found");
			this.updateStatus("No workspace folders found");
			return;
		}

		const workspaceFolder = vscode.workspace.workspaceFolders[0];

		const mainCppPath = vscode.Uri.joinPath(workspaceFolder.uri, "main.cpp");

		vscode.workspace.fs.stat(mainCppPath).then((stat) => {
			if (stat.type === vscode.FileType.File) {
				// create multipart form data with main.cpp
				// read main.cpp

				vscode.workspace.fs.readFile(mainCppPath).then((content) => {
					const formData = new FormData();
					formData.append("file", new Blob([content]), "main.cpp");

					// send request to acadnet
					this._outputChannel.appendLine("Sending request to Acadnet...");
					this._outputChannel.appendLine("File size is " + content.byteLength);
				});
			} else {
				this._outputChannel.appendLine("File main.cpp NOT found");
				this.updateStatus("File main.cpp NOT found");
			}
		});
	}

	private updateStatus(status: string) {
		if (this._view) {
			this._view.webview.postMessage({
				type: 'setStatus',
				value: status
			});
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<title>Acadnet Checker</title>
			</head>
			<body>
				<button class="check-problem">Check problem</button>

				<h3>Status: <span class="status">Ready</span></h3>

				<h4 class="status-history">Status history</h4>
				<ul class="status-list">
				</ul>

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
