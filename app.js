// require('./polyfills');


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

function fetchServersAndDMs() {
    try {
        showLoading(true);

        apiFetch("https://discord.com/api/v9/users/@me/guilds")
            .then(function(serverRes) {
                if (!serverRes.ok) throw new Error("Failed to fetch servers");
                return serverRes.json();
            })
            .then(function(servers) {
                renderServerList(servers);
                return apiFetch("https://discord.com/api/v9/users/@me/channels");
            })
            .then(function(dmRes) {
                if (!dmRes.ok) throw new Error("Failed to fetch DMs");
                return dmRes.json();
            })
            .then(function(dms) {
                renderDMList(dms);
                showLoading(false);
            })
            .catch(function(error) {
                console.error("Error fetching data:", error);
                showError("Failed to load servers and DMs. Please try again.");
                showLoading(false);
            });
    } catch (error) {
        console.error("Error fetching data:", error);
        showError("Failed to load servers and DMs. Please try again.");
        showLoading(false);
    }
}

function renderServerList(servers) {
    var serverHtml = "";
    for (var i = 0; i < servers.length; i++) {
        var server = servers[i];
        serverHtml += '<div class="item" onclick="loadServerChannels(\'' + server.id + '\', \'' + server.name + '\')">' + server.name + '</div>';
    }
    elements.serverList.innerHTML = serverHtml || "<div>No servers found</div>";
}

function renderDMList(dms) {
    var dmHtml = "";
    for (var i = 0; i < dms.length; i++) {
        var dm = dms[i];
        var recipient = dm.recipients && dm.recipients.length > 0 ? dm.recipients[0] : null;
        if (recipient) {
            dmHtml += '<div class="item" onclick="loadDM(\'' + dm.id + '\', \'' + recipient.id + '\', \'' + recipient.username + '\')">' + recipient.username + '</div>';
        }
    }
    elements.dmList.innerHTML = dmHtml || "<div>No direct messages found</div>";
}

function loadServerChannels(serverId, serverName) {
    resetAppState();
    appState.currentServerId = serverId;
    appState.currentView = 'server';

    showLoading(true);
    updateNavigation('server', serverName);

    apiFetch("https://discord.com/api/v9/guilds/" + serverId + "/channels")
        .then(function(res) {
            if (!res.ok) throw new Error("Failed to fetch channels");
            return res.json();
        })
        .then(function(channels) {
            var textChannels = [];
            for (var i = 0; i < channels.length; i++) {
                if (channels[i].type === 0) {
                    textChannels.push(channels[i]);
                }
            }

            var channelsHtml = "";
            for (var j = 0; j < textChannels.length; j++) {
                var channel = textChannels[j];
                channelsHtml += '<div class="item" onclick="loadChannel(\'' + serverId + '\', \'' + channel.id + '\', \'' + channel.name + '\')">#' + channel.name + '</div>';
            }

            elements.channelList.innerHTML = channelsHtml || "<div>No text channels found</div>";
            elements.channelList.style.display = "block";
            elements.serverList.style.display = "none";

            showLoading(false);
        })
        .catch(function(error) {
            console.error("Error fetching channels:", error);
            showError("Failed to load channels. Please try again.");
            showLoading(false);
        });
}

function loadChannel(serverId, channelId, channelName) {
    resetAppState();
    appState.currentChannelId = channelId;
    appState.currentServerId = serverId;
    appState.currentView = 'server';

    window.location.hash = "#guild-" + serverId + "/" + channelId;

    elements.headerTitle.textContent = "#" + channelName;
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

    window.location.hash = "#dm-" + userId;

    elements.headerTitle.textContent = "DM: " + username;
    elements.messageInput.disabled = false;
    elements.sendButton.disabled = false;

    fetchMessages();

    startMessageRefresh();
}

function fetchMessages() {
    if (!appState.currentChannelId) return;

    showLoading(true);

    var url = "https://discord.com/api/v9/channels/" + appState.currentChannelId + "/messages?limit=50";
    apiFetch(url)
        .then(function(res) {
            if (!res.ok) throw new Error("Failed to fetch messages");
            return res.json();
        })
        .then(function(messages) {
            appState.messages.set(appState.currentChannelId, messages);

            if (messages.length > 0) {
                appState.lastMessageId = messages[0].id;
            }

            renderMessages(messages);
            showLoading(false);
        })
        .catch(function(error) {
            console.error("Error fetching messages:", error);
            showError("Failed to load messages. Please try again.");
            showLoading(false);
        });
}

function checkNewMessages() {
    if (!appState.currentChannelId || !appState.lastMessageId) return;

    var url = "https://discord.com/api/v9/channels/" + appState.currentChannelId + "/messages?after=" + appState.lastMessageId;
    apiFetch(url)
        .then(function(res) {
            if (!res.ok) return;
            return res.json();
        })
        .then(function(newMessages) {
            if (newMessages && newMessages.length > 0) {
                appState.lastMessageId = newMessages[0].id;

                var currentMessages = appState.messages.get(appState.currentChannelId) || [];
                var reversedNewMessages = newMessages.slice().reverse();
                
                var updatedMessages = [];
                for (var i = 0; i < reversedNewMessages.length; i++) {
                    updatedMessages.push(reversedNewMessages[i]);
                }
                for (var j = 0; j < currentMessages.length; j++) {
                    updatedMessages.push(currentMessages[j]);
                }

                appState.messages.set(appState.currentChannelId, updatedMessages);
                renderMessages(updatedMessages);
            }
        })
        .catch(function(error) {
            console.error("Error checking for new messages:", error);
        });
}

function renderMessages(messages) {
    if (!messages || messages.length === 0) {
        elements.messageArea.innerHTML = "<div class='message'>No messages in this channel yet. Start a conversation!</div>";
        return;
    }

    var sortedMessages = messages.slice();
    sortedMessages.sort(function(a, b) {
        return new Date(a.timestamp) - new Date(b.timestamp);
    });

    var messagesHtml = "";
    for (var i = 0; i < sortedMessages.length; i++) {
        var msg = sortedMessages[i];
        messagesHtml += 
            '<div class="message">' +
            '<strong>' + msg.author.username + ':</strong> ' + formatMessageContent(msg.content) +
            '</div>';
    }

    elements.messageArea.innerHTML = messagesHtml;
    elements.messageArea.scrollTop = elements.messageArea.scrollHeight;
}

function formatMessageContent(content) {
    return content.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
}

function sendMessage() {
    var messageContent = elements.messageInput.value.trim();
    if (!messageContent || !appState.currentChannelId) return;

    var url = "https://discord.com/api/v9/channels/" + appState.currentChannelId + "/messages";
    var body = { content: messageContent };

    apiFetch(url, {
        method: 'POST',
        body: JSON.stringify(body)
    })
    .then(function(res) {
        if (!res.ok) throw new Error("Failed to send message");
        elements.messageInput.value = "";
        return fetchMessages();
    })
    .catch(function(error) {
        console.error("Error sending message:", error);
        showError("Failed to send message. Please try again.");
    });
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
    var hash = window.location.hash.substring(1);

    if (hash.startsWith("guild-")) {
        var parts = hash.split("/");
        if (parts.length > 1) {
            var serverId = parts[0].substring(6);
            var channelId = parts[1];
            loadChannelFromHash(serverId, channelId);
        }
    } else if (hash.startsWith("dm-")) {
        var userId = hash.split("-")[1];
        loadDmFromHash(userId);
    }
}

function loadChannelFromHash(serverId, channelId) {
    apiFetch("https://discord.com/api/v9/channels/" + channelId)
        .then(function(res) {
            if (!res.ok) throw new Error("Failed to fetch channel info");
            return res.json();
        })
        .then(function(channel) {
            loadChannel(serverId, channelId, channel.name);
        })
        .catch(function(error) {
            console.error("Error loading channel from hash:", error);
        });
}

function loadDmFromHash(userId) {
    apiFetch("https://discord.com/api/v9/users/@me/channels")
        .then(function(res) {
            if (!res.ok) throw new Error("Failed to fetch DMs");
            return res.json();
        })
        .then(function(dms) {
            var dm = null;
            for (var i = 0; i < dms.length; i++) {
                if (dms[i].recipients && 
                    dms[i].recipients.length > 0 && 
                    dms[i].recipients[0].id === userId) {
                    dm = dms[i];
                    break;
                }
            }
            
            if (dm) {
                loadDM(dm.id, userId, dm.recipients[0].username);
            }
        })
        .catch(function(error) {
            console.error("Error loading DM from hash:", error);
        });
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

function apiFetch(url, options) {
    options = options || {};
    
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();

        var method = options.method || 'GET';
        xhr.open(method, url, true);

        xhr.setRequestHeader("Authorization", appState.token);
        xhr.setRequestHeader("Content-Type", "application/json");

        if (options.headers) {
            for (var header in options.headers) {
                if (options.headers.hasOwnProperty(header)) {
                    xhr.setRequestHeader(header, options.headers[header]);
                }
            }
        }

        xhr.onload = function() {
            var response = {
                ok: xhr.status >= 200 && xhr.status < 300,
                status: xhr.status,
                statusText: xhr.statusText,
                json: function() {
                    return new Promise(function(resolve, reject) {
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