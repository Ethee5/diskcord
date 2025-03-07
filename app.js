
// global state
const appState = {
    token: localStorage.getItem("discordToken"),
    currentChannelId: null,
    currentServerId: null,
    currentDmUserId: null,
    currentView: 'main', 
    lastMessageId: null,
    refreshInterval: null,
    messages: new Map(), 
    sidebarVisible: false 
};

if (!appState.token) window.location.href = "index.html";

const elements = {
    messageArea: document.getElementById("messageArea"),
    messageInput: document.getElementById("messageInput"),
    sendButton: document.getElementById("sendMessageBtn"),
    serverList: document.getElementById("serverList"),
    channelList: document.getElementById("channelList"),
    dmList: document.getElementById("dmList"),
    backButton: document.getElementById("backButton"),
    sidebarTitle: document.getElementById("sidebarTitle"),
    headerTitle: document.getElementById("headerTitle"),
    loadingIndicator: document.getElementById("loadingIndicator"),
    sidebar: document.getElementById("sidebar")
};

initApp();

function initApp() {

    elements.messageInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            sendMessage();
        }
    });

    fetchServersAndDMs();

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
}

function toggleMenu() {
    if (appState.sidebarVisible) {
        elements.sidebar.className = "sidebar";
        elements.content.className = "content";
        appState.sidebarVisible = false;
    } else {
        elements.sidebar.className = "sidebar sidebar-visible";
        elements.content.className = "content content-shifted";
        appState.sidebarVisible = true;
    }
}

async function fetchServersAndDMs() {
    try {
        showLoading(true);

        const serverRes = await apiFetch("https://discord.com/api/v9/users/@me/guilds");
        if (!serverRes.ok) throw new Error("Failed to fetch servers");

        const servers = await serverRes.json();
        renderServerList(servers);

        const dmRes = await apiFetch("https://discord.com/api/v9/users/@me/channels");
        if (!dmRes.ok) throw new Error("Failed to fetch DMs");

        const dms = await dmRes.json();
        renderDMList(dms);

        showLoading(false);
    } catch (error) {
        console.error("Error fetching data:", error);
        showError("Failed to load servers and DMs. Please try again.");
        showLoading(false);
    }
}

function renderServerList(servers) {
    let serverHtml = "";
    servers.forEach(server => {
        serverHtml += `<div class="item" onclick="loadServerChannels('${server.id}', '${server.name}')">${server.name}</div>`;
    });
    elements.serverList.innerHTML = serverHtml || "<div>No servers found</div>";
}

function renderDMList(dms) {
    let dmHtml = "";
    dms.forEach(dm => {
        const recipient = dm.recipients?.length > 0 ? dm.recipients[0] : null;
        if (recipient) {
            dmHtml += `<div class="item" onclick="loadDM('${dm.id}', '${recipient.id}', '${recipient.username}')">${recipient.username}</div>`;
        }
    });
    elements.dmList.innerHTML = dmHtml || "<div>No direct messages found</div>";
}

async function loadServerChannels(serverId, serverName) {
    try {
        resetAppState();
        appState.currentServerId = serverId;
        appState.currentView = 'server';

        showLoading(true);
        updateNavigation('server', serverName);

        const res = await apiFetch(`https://discord.com/api/v9/guilds/${serverId}/channels`);
        if (!res.ok) throw new Error("Failed to fetch channels");

        const channels = await res.json();

        const textChannels = channels.filter(channel => channel.type === 0);

        let channelsHtml = "";
        textChannels.forEach(channel => {
            channelsHtml += `<div class="item" onclick="loadChannel('${serverId}', '${channel.id}', '${channel.name}')">#${channel.name}</div>`;
        });

        elements.channelList.innerHTML = channelsHtml || "<div>No text channels found</div>";
        elements.channelList.style.display = "block";
        elements.serverList.style.display = "none";

        showLoading(false);
    } catch (error) {
        console.error("Error fetching channels:", error);
        showError("Failed to load channels. Please try again.");
        showLoading(false);
    }
}

function loadChannel(serverId, channelId, channelName) {
    resetAppState();
    appState.currentChannelId = channelId;
    appState.currentServerId = serverId;
    appState.currentView = 'server';

    window.location.hash = `#guild-${serverId}/${channelId}`;

    elements.headerTitle.textContent = `#${channelName}`;
    elements.messageInput.disabled = false;
    elements.sendButton.disabled = false;

    fetchMessages();

    startMessageRefresh();
}

function loadDM(dmChannelId, userId, username) {
    resetAppState();
    appState.currentChannelId = dmChannelId;
    appState.currentDmUserId = userId;
    appState.currentView = 'dm';

    window.location.hash = `#dm-${userId}`;

    elements.headerTitle.textContent = `DM: ${username}`;
    elements.messageInput.disabled = false;
    elements.sendButton.disabled = false;

    fetchMessages();

    startMessageRefresh();
}

async function fetchMessages() {
    if (!appState.currentChannelId) return;

    try {
        showLoading(true);

        const url = `https://discord.com/api/v9/channels/${appState.currentChannelId}/messages?limit=50`;
        const res = await apiFetch(url);

        if (!res.ok) throw new Error("Failed to fetch messages");

        const messages = await res.json();

        appState.messages.set(appState.currentChannelId, messages);

        if (messages.length > 0) {
            appState.lastMessageId = messages[0].id;
        }

        renderMessages(messages);

        showLoading(false);
    } catch (error) {
        console.error("Error fetching messages:", error);
        showError("Failed to load messages. Please try again.");
        showLoading(false);
    }
}

async function checkNewMessages() {
    if (!appState.currentChannelId || !appState.lastMessageId) return;

    try {
        const url = `https://discord.com/api/v9/channels/${appState.currentChannelId}/messages?after=${appState.lastMessageId}`;
        const res = await apiFetch(url);

        if (!res.ok) return;

        const newMessages = await res.json();

        if (newMessages.length > 0) {

            appState.lastMessageId = newMessages[0].id;

            const currentMessages = appState.messages.get(appState.currentChannelId) || [];

            const updatedMessages = [...newMessages.reverse(), ...currentMessages];

            appState.messages.set(appState.currentChannelId, updatedMessages);

            renderMessages(updatedMessages);
        }
    } catch (error) {
        console.error("Error checking for new messages:", error);
    }
}

function renderMessages(messages) {
    if (!messages || messages.length === 0) {
        elements.messageArea.innerHTML = "<div class='message'>No messages in this channel yet. Start a conversation!</div>";
        return;
    }

    const sortedMessages = [...messages].sort((a, b) => {
        return new Date(a.timestamp) - new Date(b.timestamp);
    });

    let messagesHtml = "";
    sortedMessages.forEach(msg => {
        messagesHtml += `
            <div class="message">
                <strong>${msg.author.username}:</strong> ${formatMessageContent(msg.content)}
            </div>
        `;
    });

    elements.messageArea.innerHTML = messagesHtml;

    elements.messageArea.scrollTop = elements.messageArea.scrollHeight;
}

function formatMessageContent(content) {
    return content.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
}

async function sendMessage() {
    const messageContent = elements.messageInput.value.trim();
    if (!messageContent || !appState.currentChannelId) return;

    try {
        const url = `https://discord.com/api/v9/channels/${appState.currentChannelId}/messages`;
        const body = { content: messageContent };

        const res = await apiFetch(url, {
            method: 'POST',
            body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error("Failed to send message");

        elements.messageInput.value = "";

        await fetchMessages();
    } catch (error) {
        console.error("Error sending message:", error);
        showError("Failed to send message. Please try again.");
    }
}

function navigateBack() {
    if (appState.currentView === 'server') {
        elements.channelList.style.display = "none";
        elements.serverList.style.display = "block";
        elements.backButton.style.display = "none";
        elements.sidebarTitle.textContent = "Servers";
        appState.currentServerId = null;
        appState.currentView = 'main';
    }

    resetChatView();
}

function handleHashChange() {
    const hash = window.location.hash.substring(1);

    if (hash.startsWith("guild-")) {
        const parts = hash.split("/");
        if (parts.length > 1) {
            const serverId = parts[0].substring(6);
            const channelId = parts[1];
            loadChannelFromHash(serverId, channelId);
        }
    } else if (hash.startsWith("dm-")) {
        const userId = hash.split("-")[1];
        loadDmFromHash(userId);
    }
}

async function loadChannelFromHash(serverId, channelId) {
    try {
        const res = await apiFetch(`https://discord.com/api/v9/channels/${channelId}`);
        if (!res.ok) throw new Error("Failed to fetch channel info");

        const channel = await res.json();
        loadChannel(serverId, channelId, channel.name);
    } catch (error) {
        console.error("Error loading channel from hash:", error);
    }
}

async function loadDmFromHash(userId) {
    try {
        const res = await apiFetch("https://discord.com/api/v9/users/@me/channels");
        if (!res.ok) throw new Error("Failed to fetch DMs");

        const dms = await res.json();
        const dm = dms.find(dm =>
            dm.recipients &&
            dm.recipients.length > 0 &&
            dm.recipients[0].id === userId
        );

        if (dm) {
            loadDM(dm.id, userId, dm.recipients[0].username);
        }
    } catch (error) {
        console.error("Error loading DM from hash:", error);
    }
}

function startMessageRefresh() {
    stopMessageRefresh();

    appState.refreshInterval = setInterval(checkNewMessages, 5000);
}

function stopMessageRefresh() {
    if (appState.refreshInterval) {
        clearInterval(appState.refreshInterval);
        appState.refreshInterval = null;
    }
}

function resetAppState() {
    stopMessageRefresh();

    appState.lastMessageId = null;
    elements.messageArea.innerHTML = "";
}

function resetChatView() {
    elements.headerTitle.textContent = "Disk Cord";
    elements.messageArea.innerHTML = "<div class='message'>Select a server or DM to start chatting</div>";
    elements.messageInput.disabled = true;
    elements.sendButton.disabled = true;
    resetAppState();
}

function updateNavigation(view, title) {
    if (view === 'server') {
        elements.backButton.style.display = "block";
        elements.sidebarTitle.textContent = title;
    } else {
        elements.backButton.style.display = "none";
        elements.sidebarTitle.textContent = "Servers";
    }
}

function showLoading(isLoading) {
    elements.loadingIndicator.style.display = isLoading ? "block" : "none";
}

function showError(message) {
    alert(message);
}

function logout() {
    localStorage.removeItem("discordToken");
    window.location.href = "login.html";
}

//i used to use fetch hhere but i tried to switch to xhr instead
function apiFetch(url, options = {}) {
return new Promise((resolve, reject) => {
const xhr = new XMLHttpRequest();

const method = options.method || 'GET';
xhr.open(method, url, true);

xhr.setRequestHeader("Authorization", appState.token);
xhr.setRequestHeader("Content-Type", "application/json");

if (options.headers) {
    Object.keys(options.headers).forEach(header => {
        xhr.setRequestHeader(header, options.headers[header]);
    });
}

xhr.onload = function() {
    const response = {
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        statusText: xhr.statusText,
        json: function() {
            return new Promise((resolve, reject) => {
                try {
                    resolve(JSON.parse(xhr.responseText));
                } catch (e) {
                    reject(e);
                }
            });
        }
    };
    resolve(response);
};

xhr.onerror = function() {
    reject(new Error("Network error"));
};

if (options.body) {
    xhr.send(options.body);
} else {
    xhr.send();
}
});
}
 