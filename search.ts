import {drive_v3} from "googleapis";
import OGDSPlugin from "./main";



function gdriveFileTitle(count: number) {
	function getCollapseIcon() {
		const collapseIcon = document.createElement('div');
		collapseIcon.classList.add('tree-item-icon', 'collapse-icon');

		const collapseSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		collapseSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
		collapseSvg.setAttribute('width', '24');
		collapseSvg.setAttribute('height', '24');
		collapseSvg.setAttribute('viewBox', '0 0 24 24');
		collapseSvg.setAttribute('fill', 'none');
		collapseSvg.setAttribute('stroke', 'currentColor');
		collapseSvg.setAttribute('stroke-width', '2');
		collapseSvg.setAttribute('stroke-linecap', 'round');
		collapseSvg.setAttribute('stroke-linejoin', 'round');
		collapseSvg.classList.add('svg-icon', 'right-triangle');

		const collapsePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		collapsePath.setAttribute('d', 'M3 8L12 17L21 8');

		collapseSvg.appendChild(collapsePath);
		collapseIcon.appendChild(collapseSvg);
		return collapseIcon;
	}

	function getGDriveTitle() {
		// Inner title content
		const innerDiv = document.createElement('div');
		innerDiv.classList.add('tree-item-inner');

		const titleSpan = document.createElement('span');
		titleSpan.textContent = "Google Drive";

		innerDiv.appendChild(titleSpan);

		return innerDiv;
	}

	function gdriveResultCount(count: number) {
		// Flair (count)
		const flairOuter = document.createElement('div');
		flairOuter.classList.add('tree-item-flair-outer');

		const flairSpan = document.createElement('span');
		flairSpan.classList.add('tree-item-flair');
		flairSpan.textContent = String(count);

		flairOuter.appendChild(flairSpan);
		return flairOuter;
	}

	const gdriveFileTitle = document.createElement('div');
	gdriveFileTitle.classList.add('tree-item-self', 'search-result-file-title', 'is-clickable');
	gdriveFileTitle.appendChild(getCollapseIcon());
	gdriveFileTitle.appendChild(getGDriveTitle());
	gdriveFileTitle.appendChild(gdriveResultCount(count));

	return gdriveFileTitle;
}

function gdriveFileMatch(match: drive_v3.Schema$File): HTMLDivElement {
	const matchContainer = document.createElement('div');
	matchContainer.classList.add('search-result-file-match', 'tappable');
	matchContainer.innerText = match.name || 'Unknown';
	// on click open the file in a new tab
	matchContainer.addEventListener('click', () => {
		window.open(match.webViewLink || 'about:blank', '_blank');
	});

	return matchContainer;
}

function gdriveFileMatches(results: drive_v3.Schema$File[]) {
	function getSpacer() {
		const spacer = document.createElement('div');
		spacer.classList.add('gdrive-search-results-spacer');
		return spacer;
	}

	const gdriveFileMatches = document.createElement('div');
	gdriveFileMatches.classList.add('search-result-file-matches');

	gdriveFileMatches.appendChild(getSpacer());
	results.forEach((result) => gdriveFileMatches.appendChild(gdriveFileMatch(result)));

	return gdriveFileMatches;
}

function insertResults(results: drive_v3.Schema$File[], searchResult: HTMLElement) {
	const gdriveContainer = createEl('div');
	gdriveContainer.classList.add('gdrive-search-results', 'tree-item', 'search-result', 'is-collapsed');  //
	gdriveContainer.setAttribute('draggable', 'false');
	gdriveContainer.appendChild(gdriveFileTitle(results.length));
	gdriveContainer.appendChild(gdriveFileMatches(results));

	searchResult.insertBefore(gdriveContainer, searchResult.children[1]);
}


export async function searchGDocs(plugin: OGDSPlugin, query: string) {
	if (!plugin.drive) {
		console.error('drive not initialized');
		return;
	}

	if (!query) {
		return;
	}

	const result = await plugin.drive.files.list({
			q: 'fullText contains \'' + query + '\'',
			fields: 'files(name, webViewLink)',
			orderBy: 'modifiedTime desc',
			includeItemsFromAllDrives: true,
			supportsAllDrives: true,
		}
	)

	if (!result.data.files) {
		return;
	}

	// take only first 10 results
	result.data.files = result.data.files.slice(0, 10);

	const searchResult = this.app.workspace.getLeavesOfType('search')[0].view.containerEl.querySelector('.search-results-children');
	insertResults(result.data.files, searchResult);
}
