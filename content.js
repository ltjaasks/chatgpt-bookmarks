console.log("Bookmarks for ChatGPT v1.0")

const getMessages = () => {
    return document.querySelectorAll('[data-message-author-role="assistant"]')
}


// Generate a unique, stable ID for a message based on its content
const generateMessageId = (msg) => {
    const clone = msg.cloneNode(true)

    // remove UI elements
    clone.querySelectorAll(".bookmark-btn, .bookmark-input-container").forEach(el => el.remove())

    //const text = clone.innerText || clone.textContent
    const firstParagraph = msg.querySelector("p")?.innerText || ""
    const hash = simpleHash(firstParagraph)
    return `msg_${hash}`
}


const addMessageIds = () => {
    const messages = getMessages()
    messages.forEach(msg => {
        if (!msg.dataset.messageId) {
            msg.dataset.messageId = generateMessageId(msg)
        }
    })
}


// Simple hash function for generating IDs
const simpleHash = (str) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36)
}


// Creates the bookmark button element
const createBookmarkButton = (msg, chatId) => {
    const button = document.createElement("button")
    button.innerText = "🔖 Bookmark"
    button.className = "bookmark-btn"

    button.onclick = () => handleBookmarkClick(msg, chatId)

    return button
}


// Handles bookmark button click. If message already bookmarked, shows a message. Otherwise, shows input for bookmark title.
const handleBookmarkClick = (msg, chatId) => {
    chrome.storage.local.get(["bookmarks"], (result) => {
        const bookmarks = result.bookmarks || []
        const messageId = msg.dataset.messageId // problem (fixed, I think)

        const exists = bookmarks.some(b =>
            b.messageId === messageId && b.chatId === chatId
        )

        if (exists) {
            showMessage(msg, "Already bookmarked")
            return
        }

        if (msg.querySelector(".bookmark-input")) return

        showBookmarkInput(msg, chatId, messageId)
    })
}


const showBookmarkInput = (msg, chatId, messageId) => {
    const wrapper = msg.closest('[data-message-author-role="assistant"]')

    const input = document.createElement("input")
    input.className = "bookmark-input"
    input.placeholder = "Bookmark title..."

    const saveBtn = document.createElement("button")
    saveBtn.innerText = "Save"
    saveBtn.className = "bookmark-save-btn"

    const container = document.createElement("div")
    container.className = "bookmark-input-container"

    container.appendChild(input)
    container.appendChild(saveBtn)

    wrapper.appendChild(container)

    input.focus()

    saveBtn.onclick = () => {
        const title = input.value.trim()
        if (!title) return

        saveBookmark({ title, messageId, chatId}, msg, () => {
            renderBookmarks()
            animateNewBookmark()
            container.remove()
        })
    }
}


const animateNewBookmark = () => {
    setTimeout(() => {
        const dots = document.querySelectorAll("#bookmark-sidebar div")
        const lastDot = dots[dots.length - 1]

        if (lastDot) {
            lastDot.style.transform = "scale(2.5)"
            setTimeout(() => {
                lastDot.style.transform = "scale(1)"
            }, 500)
        }
    }, 50)
}


// Add bookmark buttons to all Chatgpt responses
const addButtons = () => {
    const messages = document.querySelectorAll(
        '[data-message-author-role="assistant"]'
    )

    const chatId = location.pathname

    messages.forEach((msg) => {
        if (!msg) return

        if (msg.dataset.bookmarkAdded) return

        msg.dataset.bookmarkAdded = "true"

        /*
        // Assign message ID if not already assigned
        if (!msg.dataset.messageId) {
            msg.dataset.messageId = generateMessageId(msg)
        }
        */

        let container = msg.querySelector(":scope > .bookmark-container")

        if (!container) {
            container = document.createElement("div")
            container.className = "bookmark-container"
            msg.appendChild(container)
        }

        const button = createBookmarkButton(msg, chatId)
        msg.appendChild(button)
    })
}


const saveBookmark = (bookmark, msg, callback) => {
    if (!msg.dataset.messageId) {
        msg.dataset.messageId = generateMessageId(msg)
    }
    chrome.storage.local.get(["bookmarks"], (result) => {
        const bookmarks = result.bookmarks || []

        bookmarks.push(bookmark)

        chrome.storage.local.set({ bookmarks }, callback)
    })
}


const createSidebar = () => {
    let sidebar = document.getElementById("bookmark-sidebar")

    if (sidebar) return sidebar

    sidebar = document.createElement("div")
    sidebar.id = "bookmark-sidebar"

    document.body.appendChild(sidebar)

    return sidebar
}


const getMessagePositionMap = () => {
    const messages = Array.from(getMessages())
    const map = new Map()

    messages.forEach((msg, index) => {
        if (msg.dataset.messageId) {
            map.set(msg.dataset.messageId, index)
        }
    })

    return map
}


const getSortedBookmarks = (bookmarks, chatId, positionMap) => {
    return (bookmarks ||[])
        .filter(b => b.chatId === chatId)
        .sort((a, b) => {
            const posA = positionMap.get(a.messageId) ?? Infinity
            const posB = positionMap.get(b.messageId) ?? Infinity
            return posA - posB
        })
}


const scrollToMessage = (messageId) => {
    const messages = getMessages()
    const target = Array.from(messages).find(
        msg => msg.dataset.messageId === messageId
    )
    
    if (!target) return null

    target.scrollIntoView({
        behavior: "smooth",
        block: "start"
    })

    target.style.outline = "2px solid red"

    setTimeout(() => {
        target.style.outline = ""
    }, 2000)

    return target
}


// Menu for delete/edit bookmark
const handleContextMenu = (e, bm) => {
    e.preventDefault()

    document.querySelectorAll(".bookmark-menu").forEach(m => m.remove())
    
    const menu = createMenu(bm)

    const menuWidth = 120
    const menuHeight = 60

    let x = e.clientX
    let y = e.clientY

    if (x + menuWidth > window.innerWidth) {
        x = window.innerWidth - menuWidth - 10
    }

    if (y + menuHeight > window.innerHeight) {
        y = window.innerHeight - menuHeight - 10
    }

    menu.style.left = x + "px"
    menu.style.top = y + "px"

    document.body.appendChild(menu)
}


const createbookmarkItem = (bm) => {
    const item = document.createElement("div")
    item.className = "bookmark-item"
    item.title = bm.title

    const dot = document.createElement("div")
    dot.className = "bookmark-dot"

    const label = document.createElement("span")
    label.innerText = bm.title
    label.className = "bookmark-label"

    item.onclick = () => {
        const target = scrollToMessage(bm.messageId)

        if (!target) {
            showMessage(item, "Message not found")
        }
    }

    item.oncontextmenu = (e) => handleContextMenu(e, bm)

    item.appendChild(dot)
    item.appendChild(label)

    return item
}


// Render bookmarks in the sidebar
const renderBookmarks = () => {
    const chatId = location.pathname
    const sidebar = createSidebar()

    // Get bookmarks of the current page
    chrome.storage.local.get(["bookmarks"], (result) => {
        const positionMap = getMessagePositionMap()

        const bookmarks = getSortedBookmarks(
            result.bookmarks, 
            chatId, 
            positionMap
        )

        sidebar.innerHTML = ""

        bookmarks.forEach((bm, i) => {
            const item = createbookmarkItem(bm)
            sidebar.appendChild(item)
        })
    })
}


const createMenu = (bm) => {
    const menu = document.createElement("div")

    menu.className = "bookmark-menu"

    const edit = document.createElement("div")
    edit.innerText = "Edit title"

    const del = document.createElement("div")
    del.innerText = "Delete"

    menu.appendChild(edit)
    menu.appendChild(del)

    menu.onclick = (e) => {
        e.stopPropagation()
    }

    edit.className = "bookmark-menu-item"
    del.className = "bookmark-menu-item"

    del.onclick = () => {
        chrome.storage.local.get(["bookmarks"], (result) => {
            const all = result.bookmarks || []

            const updated = all.filter(b =>
                !isSameBookmark(b, bm)
            )

            chrome.storage.local.set({ bookmarks: updated }, renderBookmarks)
            menu.remove()
        })
    }

    edit.onclick = () => handleEdit(bm, menu)

    return menu
}


const handleEdit = (bm, menu) => {
    menu.remove()

    const messages = getMessages()
    const msg = Array.from(messages).find(m => m.dataset.messageId === bm.messageId)

    if (!msg) return

    // Prevent duplicate input
    if (msg.querySelector(".bookmark-input")) return

    const input = document.createElement("input")
    input.className = "bookmark-input"
    input.value = bm.title


    const saveBtn = document.createElement("button")
    saveBtn.className = "bookmark-save-btn"
    saveBtn.innerText = "Save"

    const container = document.createElement("div")
    container.className = "bookmark-input-container"

    container.appendChild(input)
    container.appendChild(saveBtn)

    msg.appendChild(container)

    input.focus()

    saveBtn.onclick = () => {
        const newTitle = input.value.trim()
        if (!newTitle) return

        chrome.storage.local.get(["bookmarks"], (result) => {
            const all = result.bookmarks || []

            const updated = all.map(b => {
                if (
                    isSameBookmark(b, bm)
                ) {
                    return { ...b, title: newTitle }
                }
                return b
            })

            chrome.storage.local.set({ bookmarks: updated }, () => {
                renderBookmarks()
                input.remove()
                saveBtn.remove()
            })
        })
    }
}


const showMessage = (msg, text) => {
    const note = document.createElement("div")
    note.innerText = text
    note.className = "bookmark-message"

    msg.appendChild(note)

    setTimeout(() => {
        note.remove()
    }, 1500)
}


const isSameBookmark = (a, b) => {
    return a.messageId === b.messageId && a.chatId === b.chatId
}


let lastChatId = location.pathname

const onUrlChange = () => {
    const currentChatId = location.pathname

    if (currentChatId !== lastChatId) {
        lastChatId = currentChatId

        // Reset message state
        getMessages().forEach(msg => {
            delete msg.dataset.bookmarkAdded
            delete msg.dataset.bookmarkProcessing
            delete msg.dataset.messageId
        })

        addButtons()
        renderBookmarks()
    }
}

// Run once, add buttons to the end of chatgpt responses
addButtons()

const originalPushState = history.pushState

// Calls onUrlChange on history changes (single page app solution)
const wrapHistoryMethod = (type) => {
    const original = history[type]

    history[type] = function () {
        const result = original.apply(this, arguments)
        onUrlChange()
        return result
    }
}

wrapHistoryMethod("pushState")
wrapHistoryMethod("replaceState")

// Browser back/forward buttons handler
window.addEventListener("popstate", onUrlChange)

setInterval(() => {
    if (location.pathname !== lastChatId) {
        onUrlChange()
    }
}, 300)

// Render on load
renderBookmarks()
addMessageIds()

document.addEventListener("click", () => {
    document.querySelectorAll(".bookmark-menu").forEach(m => m.remove())
})

let addButtonsTimeout;

const observer = new MutationObserver(() => {
    clearTimeout(addButtonsTimeout)

    addButtonsTimeout = setTimeout(() => {
        addButtons()
    }, 200)
})

observer.observe(document.body, { childList: true, subtree: true })