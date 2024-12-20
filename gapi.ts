import {google} from "googleapis";
import OGDSPlugin from "./main";
import {Notice, Setting} from "obsidian";
import * as http from 'http';
import {OAuth2Client} from "google-auth-library";

export interface GAPISettings {
	token?: string;
	clientId?: string;
	clientSecret?: string;
}

export const DEFAULT_GAPI_SETTINGS: GAPISettings = {
	token: undefined,
	clientId: '',
	clientSecret: '',
};

export function getOAuth2Client(plugin: OGDSPlugin) {
	const client_id = plugin.settings.gapiSettings.clientId!;
	const client_secret = plugin.settings.gapiSettings.clientSecret!;

	const oAuth2Client = new google.auth.OAuth2(
		client_id,
		client_secret,
		'http://localhost:44372/callback' // or the redirect URI you configured
	);

	if (plugin.settings.gapiSettings.token) {
		oAuth2Client.setCredentials(JSON.parse(plugin.settings.gapiSettings.token));
	}

	return oAuth2Client;
}

// initialize the Google Drive API
export function initDrive(plugin: OGDSPlugin) {
	plugin.drive = google.drive({
		version: 'v3',
		auth: getOAuth2Client(plugin),
	});
}

// run server for Google authentication
export function startAuthServer(plugin: OGDSPlugin, oAuth2Client: OAuth2Client): Promise<void> {
	return new Promise((resolve) => {
		const server = http.createServer(async (req, res) => {
			if (req.url && req.url.startsWith('/callback')) {
				const urlObj = new URL(req.url, 'http://localhost:44372');
				const code = urlObj.searchParams.get('code');

				if (code) {
					try {
						const { tokens } = await oAuth2Client.getToken(code);
						oAuth2Client.setCredentials(tokens);

						plugin.settings.gapiSettings.token = JSON.stringify(tokens);
						await plugin.saveSettings();

						// Notify the user that authentication is complete.
						res.writeHead(200, { 'Content-Type': 'text/plain' });
						res.end('Authentication successful! You can close this tab and return to the application.');

						// Close the server and resolve the promise once we've saved the token.
						server.close(() => {
							new Notice('Authentication server closed after successful token retrieval.');
							resolve();
						});
					} catch (error) {
						console.error('Error retrieving access token:', error);
						res.writeHead(500, { 'Content-Type': 'text/plain' });
						res.end('Error retrieving tokens. Check the console logs.');
						// You can decide to reject or handle differently if token retrieval fails.
					}
				} else {
					res.writeHead(400, { 'Content-Type': 'text/plain' });
					res.end('No code found in the callback URL.');
				}
			} else {
				res.writeHead(404, { 'Content-Type': 'text/plain' });
				res.end('Not found');
			}
		});

		server.listen(44372, () => {
			new Notice('Authentication server listening on http://localhost:44372');
		});
	});
}

// This function sets up all the Google API related UI elements in the settings tab.
export function addGoogleApiSettings(
	containerEl: HTMLElement,
	plugin: OGDSPlugin,
	display: () => void
) {
	new Setting(containerEl)
		.setName('Google API Client ID')
		.setDesc('Enter your Google API Client ID here.')
		.addText((text) =>
			text
				.setPlaceholder('Client ID')
				.setValue(plugin.settings.gapiSettings.clientId || '')
				.onChange(async (value) => {
					plugin.settings.gapiSettings.clientId = value || '';
					await plugin.saveSettings();
				})
		);

	new Setting(containerEl)
		.setName('Google API Client Secret')
		.setDesc('Enter your Google API Client Secret here.')
		.addText((text) =>
			text
				.setPlaceholder('Client Secret')
				.setValue(plugin.settings.gapiSettings.clientSecret || '')
				.onChange(async (value) => {
					plugin.settings.gapiSettings.clientSecret = value || '';
					await plugin.saveSettings();
					display();
				})
		);

		new Setting(containerEl)
			.setName('Connect to Google')
			.setDesc('Click to generate an authentication URL and complete the OAuth flow.')
			.addButton((btn) =>
				btn.setButtonText('Get Auth URL').onClick(async () => {
					if (!plugin.settings.gapiSettings.clientId || !plugin.settings.gapiSettings.clientSecret) {
						new Notice('Please enter your Client ID and Client Secret first.');
						return;
					}

					const oAuth2Client = getOAuth2Client(plugin);

					// SCOPES: adjust these as per your needs
					const SCOPES = [
						'https://www.googleapis.com/auth/drive.metadata.readonly',
						'https://www.googleapis.com/auth/drive.readonly',
					];

					const authUrl = oAuth2Client.generateAuthUrl({
						access_type: 'offline',
						scope: SCOPES,
					});

					new Notice('Authentication URL generated. Copy and open it in a browser.');

					new Setting(containerEl)
						.setName('Authentication URL')
						.setDesc('Open this URL in your browser to authenticate.')
						.addText((text) => {
							text.setValue(authUrl).onChange(() => {
								// Just display it, no changes needed
							});
						});

					startAuthServer(plugin, oAuth2Client).then(() => {
						// At this point, the token has been saved.
						// You can initialize the plugin's resources or update UI accordingly.
						plugin.initThings();
						new Notice('Successfully authenticated and token saved!');
						display();
					}).catch(err => {
						new Notice('Authentication failed: ' + err);
					});

				})
			);

	// Display current status
	if (plugin.settings.gapiSettings.token) {
		containerEl.createEl('p', { text: 'You are currently authenticated.' });

		if (!plugin.drive) {
			initDrive(plugin);
		}

		new Setting(containerEl)
			.setName('Verify Credentials')
			.setDesc('Check if your stored OAuth credentials are valid.')
			.addButton((btn) =>
				btn.setButtonText('Verify').onClick(async () => {
					try {
						// Attempt a simple call to verify the credentials.
						// @ts-ignore
						const res = await plugin.drive.about.get({ fields: 'user' });
						if (res.data && res.data.user) {
							new Notice('Credentials verified successfully!');
						} else {
							new Notice('Failed to verify credentials. Please re-authenticate.');
						}
					} catch (err) {
						new Notice('Error verifying credentials: ' + err);
					}
				})
			);

		new Setting(containerEl)
			.setName('Revoke Token')
			.setDesc('Remove saved OAuth token and require re-authentication.')
			.addButton((btn) =>
				btn.setButtonText('Revoke').onClick(async () => {
					plugin.settings.gapiSettings.token = undefined;
					await plugin.saveSettings();
					new Notice('Token revoked.');
					display();
				})
			);
	} else {
		containerEl.createEl('p', { text: 'Not authenticated yet.' });
	}
}
