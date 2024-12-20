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

Just use global search as usual, first 10 results would be from Google Drive sorted by last time accessed. You can click on the result to open the file in browser.

## Spoiler

No guarantees provided. Pull requests are welcome, especially in the results representation part.
