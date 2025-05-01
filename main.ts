import {App, Plugin, PluginSettingTab} from 'obsidian';
import {drive_v3} from 'googleapis';

import {GAPISettings, DEFAULT_GAPI_SETTINGS, addGoogleApiSettings, initDrive} from './gapi'
import {searchGDocs} from "./search";

interface OGDSSettings {
	gapiSettings: GAPISettings;
}

const DEFAULT_SETTINGS: OGDSSettings = {
	gapiSettings: DEFAULT_GAPI_SETTINGS,
};

export default class OGDSPlugin extends Plugin {
	settings: OGDSSettings;
	drive?: drive_v3.Drive;
	private keypressHandler?: (event: KeyboardEvent) => void;
	private searchInput: any;

	checkSearchFunction() {
		const searchLeaf = this.app.workspace.getLeavesOfType('search')[0];
		if (!searchLeaf) {
			setTimeout(() => this.checkSearchFunction(), 200);
			return;
		}

		const search = searchLeaf.view;
		if (!search) {
			setTimeout(() => this.checkSearchFunction(), 200);
			return;
		}

		// Find the search input element
		// @ts-ignore
		const input = searchLeaf.containerEl.querySelector('input');
		if (!input) {
			setTimeout(() => this.checkSearchFunction(), 200);
			return;
		}

		// If we've already added the listener, do nothing
		if (this.searchInput === input && this.keypressHandler) {
			return;
		}

		this.searchInput = input as HTMLInputElement;

		// Define the event handler once and store it
		this.keypressHandler = (event: KeyboardEvent) => {
			if (event.key === 'Enter') {
				// @ts-ignore
				searchGDocs(this.app.plugins.plugins['gdrive-search'], search.getQuery());
			}
		};

		this.searchInput.addEventListener('keypress', this.keypressHandler);
	}

	initThings() {
		if (this.settings.gapiSettings.token) {
			// monkey patch the search function
			this.checkSearchFunction();

			// initialize the Google Drive API
			initDrive(this);
		}
	}
	async onload() {
		await this.loadSettings();
		this.initThings();
		this.addSettingTab(new OGDSSettingTab(this.app, this));
	}

	onunload() {
		if (this.searchInput && this.keypressHandler) {
			this.searchInput.removeEventListener('keypress', this.keypressHandler);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class OGDSSettingTab extends PluginSettingTab {
	plugin: OGDSPlugin;

	constructor(app: App, plugin: OGDSPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		addGoogleApiSettings(containerEl, this.plugin, () => this.display());
	}
}
