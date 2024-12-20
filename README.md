# Google Drive Search

A plugin that implements search over Google Drive files in addition to the default global search.

## Installation

Do the same as https://yukigasai.github.io/obsidian-google-calendar/Setup, but:
- Use Google Drive API instead of Calendar
- Choose Desktop app instead of Web app
- Do not set Authorized redirect URIs and Authorized JavaScript origins (doesn't matter what you set)
- After that - go to settings, enter your client ID and client secret, click auth button, open the URL and follow the authentication process
- You can check your credentials after that using Verify button

## Usage

Use the global search and press enter in the search field (the plugin reacts on keypress Enter), first 10 results would be from Google Drive sorted by last time accessed. You can click on the result to open the file in browser.

## Known bugs

If you scroll down the search results, google drive would disappear. This is because Obsidian redraws the virtual display and I have no idea yet where the actual results are stored. If you know - please tell me. Thx.

## Spoiler

No guarantees provided. Pull requests are welcome, especially in the results representation part.
