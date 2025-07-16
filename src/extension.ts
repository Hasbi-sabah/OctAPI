import * as vscode from "vscode";
import { initializeCache, RouteCache } from "./utils/cache";
import { setupFileWatcher } from "./utils/fileWatcher";
import OctAPIWebviewProvider from "./webview/OctAPIWebviewProvider";
import { FeedbackState } from "./types";

// Session tracking variables
let sessionStart: number | null = null;
let totalActiveTime = 0;

const DEFAULT_STATE: FeedbackState = {
	optedOut: false,
	lastFeedback: 0,
	totalActiveMinutes: 0
};
const FEEDBACK_THRESHOLD_HOURS = 3;
const FEEDBACK_COOLDOWN_HOURS = 24;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log("It is game ON!");
	if (!(context.globalState.get<FeedbackState>('feedback') || DEFAULT_STATE).optedOut) initSessionCount(context)

	// Create the OctAPIWebviewProvider and register it as a Webview View
	const provider = new OctAPIWebviewProvider(context);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider("OctAPISideBar", provider));

	// Setup file watcher to monitor changes in the specified path
	setupFileWatcher(provider, context).initialize();

	// Initialize the cache with the current routes
	initializeCache(provider);

	// Command to refresh the webview content
	const refresh = vscode.commands.registerCommand("octapi.refreshEntry", async () => {
		try {
			// Clear the route cache
			RouteCache.getInstance().clear();

			// Update the webview
			provider.updateWebview(true);

			// Reinitialize the cache
			await initializeCache(provider);

			// Update the webview again
			provider.updateWebview();
		} catch (error) {
			console.error("Refresh failed:", error);
		}
	});
	context.subscriptions.push(refresh);

	// Command to open extension settings
	const openSettings = vscode.commands.registerCommand("octapi.openSettings", () => {
		vscode.commands.executeCommand("workbench.action.openSettings", "OctAPI");
	});
	context.subscriptions.push(openSettings);

	// Command to open feedback form
	const openFeedbackForm = vscode.commands.registerCommand("octapi.feedback", () => {
		const feedbackFormUrl = "https://forms.gle/5bimyt7Y1UAJvEB39";
		vscode.env.openExternal(vscode.Uri.parse(feedbackFormUrl));
	});
	context.subscriptions.push(openFeedbackForm);

	// Listen for configuration changes and refresh the webview if needed
	vscode.workspace.onDidChangeConfiguration((event) => {
		if (event.affectsConfiguration("OctAPI.path") || event.affectsConfiguration("OctAPI.framework")) {
			provider.updateWebview(true);
		}
	});

	// Command to clear favorite routes
	const clearFavorites = vscode.commands.registerCommand("octapi.clearFavs", () => {
		provider.starredRoutes.clear();
		provider.persistStarredRoutes();
		provider.updateWebview();
	});
	context.subscriptions.push(clearFavorites);

	// Command to download routes
	const postmanExport = vscode.commands.registerCommand("octapi.postmanExport", () => {
		provider.postmanExport();
	});
	context.subscriptions.push(postmanExport);
}

function initSessionCount(context: vscode.ExtensionContext) {
	// Track window focus
	const focusDisposable = vscode.window.onDidChangeWindowState(windowState => {
		const currentState = context.globalState.get<FeedbackState>('feedback') || DEFAULT_STATE;
		if (currentState.optedOut) {
			if (focusDisposable) {
				focusDisposable.dispose();
			}
			return;
		}
		if (windowState.focused) {
			const state = context.globalState.get<FeedbackState>('feedback') || DEFAULT_STATE;
			// triggerFeedbackRequest(context);
			sessionStart = Date.now();
		} else if (sessionStart) {
			const state = context.globalState.get<FeedbackState>('feedback') || DEFAULT_STATE;
			const sessionMinutes = (Date.now() - sessionStart) / 60000;
			totalActiveTime += sessionMinutes;

			// Update persistent state
			const updatedState: FeedbackState = {
				...state,
				totalActiveMinutes: state.totalActiveMinutes + sessionMinutes
			};
			context.globalState.update('feedback', updatedState);

			checkFeedbackThreshold(context);

			sessionStart = null;
		}
	});

	context.subscriptions.push(focusDisposable);

	// Initialize session if window is already focused
	if (vscode.window.state.focused) {
		sessionStart = Date.now();
	}
}

function checkFeedbackThreshold(context: vscode.ExtensionContext) {
    const state = context.globalState.get<FeedbackState>('feedback') || DEFAULT_STATE;

    // Check if we've reached the threshold and enough time has passed since last feedback
    const timeSinceLastFeedback = Date.now() - state.lastFeedback;
    const cooldownPassed = timeSinceLastFeedback > (FEEDBACK_COOLDOWN_HOURS * 60 * 60 * 1000);

    // Convert total active minutes to hours for comparison
    const totalActiveHours = state.totalActiveMinutes / 60;

    if (totalActiveHours >= FEEDBACK_THRESHOLD_HOURS &&
        !state.optedOut &&
        cooldownPassed) {

        triggerFeedbackRequest(context);
    }
}

function triggerFeedbackRequest(context: vscode.ExtensionContext) {
	const message = `You've been using OctAPI for a little while! Would you like to share your feedback?`;

	vscode.window.showInformationMessage(
		message,
		'Give Feedback',
		'Remind Me Later',
		'Don\'t Ask Again'
	).then(selection => {
		const state = context.globalState.get<FeedbackState>('feedback') || DEFAULT_STATE;
		if (selection === undefined) selection = 'Remind Me Later';

		switch (selection) {
			case 'Give Feedback':
				// Open feedback form
				const feedbackFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLSeiaic-GYnszwDDgto_JF2mLJ8nGrK_V43p1mftuJutYYRwPw/viewform?usp=dialog";
				vscode.env.openExternal(vscode.Uri.parse(feedbackFormUrl));

				// Update state to mark feedback given
				const updatedState: FeedbackState = {
					...state,
					optedOut: true
				};
				context.globalState.update('feedback', updatedState);
				break;

			case 'Remind Me Later':
				// Update last feedback time to delay next prompt
				const delayedState: FeedbackState = {
					...state,
					lastFeedback: Date.now()
				};
				context.globalState.update('feedback', delayedState);
				break;

			case 'Don\'t Ask Again':
				// User opted out permanently
				const optedOutState: FeedbackState = {
					...state,
					optedOut: true,
				};
				context.globalState.update('feedback', optedOutState);
				break;
		}
	});
}

// This method is called when your extension is deactivated
export function deactivate() { }