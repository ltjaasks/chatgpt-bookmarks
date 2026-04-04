# 🔖 ChatGPT Bookmark Extension

A lightweight browser extension that lets you bookmark specific responses inside ChatGPT conversations and quickly jump back to them later.

---

## Features

* 🔖 Bookmark any message in a conversation
* Sidebar with saved bookmarks
* Smooth scrolling to bookmarked messages
* Bookmarks are conversation specific and the extension keeps track of the current conversation
* Persistent storage through chrome local storage (bookmarks survive refresh & reopen)

---

## How It Works

Each message is assigned a stable ID, allowing bookmarks to remain accurate even after refreshing the page or adding new messages.

Bookmarks are:

* Stored locally using `chrome.storage`
* Matched to messages via unique IDs

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/ltjaasks/chatgpt-bookmarks.git
```

### 2. Load the extension in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the project folder

---

## Usage

1. Open ChatGPT
2. Click the **🔖 Bookmark** button under any message
3. Enter a title and save
4. Use the sidebar to navigate between bookmarks

---

## Project Structure

```
├── content.js       # Main logic (DOM interaction, bookmarks)
├── styles.css      # Styling for buttons and sidebar
├── manifest.json   # Extension configuration
```

---

## Tech Stack

* JavaScript (Vanilla)
* Chrome Extensions API
* DOM Manipulation

---

## Current Status

Core functionality is complete and stable.

Known issues:

* During rendering the page wobbles as bookmark buttons are added to responses
* Bookmarks ordering is inconsistent
* Switching tabs when a response is being generated causes the bookmark button to appear in the middle of the response
