//handling message related operations
function MessageManager(app) {
    this.app = app;
    this.messageFormatter = new MessageFormatter();

    //the rest is obvious from the name
    this.fetchMessages = function () {
        if (!this.app.state.currentChannelId) return;

        this.app.uiManager.showLoading(true);

        var requestUrl = "https://discord.com/api/v9/channels/" + this.app.state.currentChannelId + "/messages?limit=50";

        this.app.apiService.fetch(requestUrl)
            .then(function (res) {
                if (!res.ok) throw new Error("Failed to fetch messages");
                return res.json();
            })
            .then(function (messages) {
                if (!messages || messages.length === 0) {
                    this.app.uiManager.showLoading(false);
                    return;
                }

                this.app.state.messages[this.app.state.currentChannelId] = messages.reverse();

                if (messages.length > 0) {
                    this.app.state.lastMessageId = messages[messages.length - 1].id;
                }

                this.renderMessages(this.app.state.messages[this.app.state.currentChannelId]);
                this.app.uiManager.showLoading(false);
            }.bind(this))
            .catch(function (error) {
                console.error("Error fetching messages:", error);
                this.app.uiManager.showError("Failed to load messages. Please try again.");
                this.app.uiManager.showLoading(false);
            }.bind(this));
    };

    this.checkNewMessages = function () {
        if (!this.app.state.currentChannelId || !this.app.state.lastMessageId) return;

        var url = "https://discord.com/api/v9/channels/" + this.app.state.currentChannelId + "/messages?after=" + this.app.state.lastMessageId;

        this.app.apiService.fetch(url)
            .then(function (res) {
                if (!res.ok) return;
                return res.json();
            })
            .then(function (newMessages) {
                if (!newMessages || newMessages.length === 0) return;

                var currentMessages = this.app.state.messages[this.app.state.currentChannelId] || [];

                var existingMessageIds = {};
                for (var i = 0; i < currentMessages.length; i++) {
                    existingMessageIds[currentMessages[i].id] = true;
                }

                var uniqueNewMessages = [];
                for (var j = 0; j < newMessages.length; j++) {
                    if (!existingMessageIds[newMessages[j].id]) {
                        uniqueNewMessages.push(newMessages[j]);
                    }
                }

                if (uniqueNewMessages.length === 0) return;

                uniqueNewMessages.sort(function (a, b) {
                    return new Date(a.timestamp) - new Date(b.timestamp);
                });

                if (uniqueNewMessages.length > 0) {
                    this.app.state.lastMessageId = uniqueNewMessages[uniqueNewMessages.length - 1].id;

                    if (this.app.state.currentView === 'dm' && document.visibilityState !== 'visible') {
                        this.showDmNotification(uniqueNewMessages);
                    }
                }

                for (var k = 0; k < uniqueNewMessages.length; k++) {
                    currentMessages.push(uniqueNewMessages[k]);
                }

                this.app.state.messages[this.app.state.currentChannelId] = currentMessages;

                this.renderMessages(this.app.state.messages[this.app.state.currentChannelId]);
            }.bind(this))
            .catch(function (error) {
                console.error("Error checking for new messages:", error);
            });
    };

    this.initializeAllDmTracking = function () {
        this.app.apiService.fetch("https://discord.com/api/v9/users/@me/channels")
            .then(function (res) {
                if (!res.ok) throw new Error("Failed to fetch DMs");
                return res.json();
            })
            .then(function (dms) {
                for (var i = 0; i < dms.length; i++) {
                    var dm = dms[i];
                    if (dm.last_message_id) {
                        this.app.state.lastSeenMessageIds[dm.id] = dm.last_message_id;
                    } else {
                        this.app.state.lastSeenMessageIds[dm.id] = "0";
                    }
                }
            }.bind(this))
            .catch(function (error) {
                console.error("Error initializing DM tracking:", error);
            });
    };

    this.checkDmNotifications = function () {
        this.app.apiService.fetch("https://discord.com/api/v9/users/@me/channels")
            .then(function (res) {
                if (!res.ok) throw new Error("Failed to fetch DMs");
                return res.json();
            })
            .then(function (dms) {
                for (var i = 0; i < dms.length; i++) {
                    var dm = dms[i];
                    if (!dm.last_message_id) continue;

                    var lastSeenId = this.app.state.lastSeenMessageIds[dm.id] || "0";

                    if (BigInt(dm.last_message_id) > BigInt(lastSeenId) &&
                        (this.app.state.currentChannelId !== dm.id || document.visibilityState !== 'visible')) {
                        this.fetchLastDmMessage(dm);
                    }

                    this.app.state.lastSeenMessageIds[dm.id] = dm.last_message_id;
                }
            }.bind(this))
            .catch(function (error) {
                console.error("Error checking DM notifications:", error);
            });
    };

    this.fetchLastDmMessage = function (dm) {
        this.app.apiService.fetch("https://discord.com/api/v9/channels/" + dm.id + "/messages?limit=1")
            .then(function (res) {
                if (!res.ok) return;
                return res.json();
            })
            .then(function (messages) {
                if (messages && messages.length > 0) {
                    var message = messages[0];

                    var messageTime = new Date(message.timestamp).getTime();
                    var currentTime = new Date().getTime();
                    var isRecent = (currentTime - messageTime) < 60000;

                    if (isRecent) {
                        var recipient = dm.recipients && dm.recipients.length > 0 ? dm.recipients[0] : null;

                        if (recipient) {
                            this.showNotification(recipient.username, message.content);
                        }
                    }
                }
            }.bind(this));
    };

    this.showNotification = function (sender, content) {
        if (!("Notification" in window)) {
            console.log("This browser does not support desktop notifications");
            return;
        }

        if (Notification.permission === "granted") {
            var notification = new Notification("New message from " + sender, {
                body: content
            });

            notification.onclick = function () {
                window.focus();
            };
        }
        else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(function (permission) {
                if (permission === "granted") {
                    var notification = new Notification("New message from " + sender, {
                        body: content,
                        icon: "assets/img/logo.png"
                    });

                    notification.onclick = function () {
                        window.focus();
                    };
                }
            });
        }
    };

    this.showDmNotification = function (messages) {
        if (messages && messages.length > 0) {
            var lastMessage = messages[messages.length - 1];
            this.showNotification(lastMessage.author.username, lastMessage.content);
        }
    };

    this.renderMessages = function (messages) {
        var messageArea = this.app.uiManager.elements.messageArea;

        if (!messages || messages.length === 0) {
            messageArea.innerHTML = "<div class='message'>No messages in this channel yet. Start a conversation!</div>";
            return;
        }

        var wasAtBottom = this.isNearBottom(messageArea);

        var sortedMessages = messages.slice().sort(function (a, b) {
            return new Date(a.timestamp) - new Date(b.timestamp);
        });

        var messagesHTML = '';
        
        for (var i = 0; i < sortedMessages.length; i++) {
            var msg = sortedMessages[i];
            var messageId = msg.id;
            
            var avatarUrl = msg.author.avatar
                ? "https://cdn.discordapp.com/avatars/" + msg.author.id + "/" + msg.author.avatar + ".png"
                : "https://cdn.discordapp.com/embed/avatars/0.png";
                
            var timestamp = new Date(msg.timestamp);
            var formattedTimestamp = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            var replyHTML = '';
            if (msg.referenced_message) {
                replyHTML = 
                    '<div class="reply-container">' +
                        '<div class="reply-label">Replying to ' + msg.referenced_message.author.username + '</div>' +
                        '<div class="reply-content-container">' +
                            '<span class="reply-content">' + msg.referenced_message.content + '</span>' +
                        '</div>' +
                    '</div>';
            }
            
            var formattedContent = this.messageFormatter.formatContent(msg.content);
            
            var attachmentsHTML = '';
            if (msg.attachments && msg.attachments.length > 0) {
                attachmentsHTML = '<div class="attachment-container">';
                
                for (var a = 0; a < msg.attachments.length; a++) {
                    var attachment = msg.attachments[a];
                    
                    if (attachment.content_type && attachment.content_type.startsWith("image/")) {
                        attachmentsHTML += '<img src="' + attachment.url + '" class="attachment-image">';
                    } else if (attachment.content_type && attachment.content_type.startsWith("video/")) {
                        attachmentsHTML += '<video src="' + attachment.url + '" controls class="attachment-video"></video>';
                    } else {
                        attachmentsHTML += '<a href="' + attachment.url + '" class="attachment-file">[' + 
                            attachment.filename + ' (' + (attachment.size / 1024 / 1024).toFixed(2) + 'MB)]</a>';
                    }
                }
                
                attachmentsHTML += '</div>';
            }
            
            messagesHTML += 
                '<div class="message" data-message-id="' + messageId + '">' +
                    '<img src="' + avatarUrl + '" class="avatar" alt="' + msg.author.username + '">' +
                    '<div class="message-content">' +
                        '<strong>' + msg.author.username + ' • ' + formattedTimestamp + '</strong>' +
                        replyHTML +
                        ' <span>' + formattedContent + '</span>' +
                        attachmentsHTML +
                    '</div>' +
                '</div>';
        }

        var containerHTML = '<div class="messages-container">' + messagesHTML + '</div>';

        messageArea.innerHTML = containerHTML;

        if (window.twemoji) {
            twemoji.parse(messageArea, {
                folder: 'svg',
                ext: '.svg',
                size: '72x72'
            });
        }

        if (wasAtBottom) {
            messageArea.scrollTop = messageArea.scrollHeight;
        }
    };

    this.isNearBottom = function (element) {
        return element.scrollHeight - element.scrollTop - element.clientHeight < 50;
    };

    this.isScrolledToBottom = function () {
        var element = this.app.uiManager.elements.messageArea;
        return element.scrollHeight - element.scrollTop - element.clientHeight < 50;
    };

    this.sendMessage = function () {
        var messageContent = this.app.uiManager.elements.messageInput.value.trim();
        if (!messageContent || !this.app.state.currentChannelId) return;

        var url = "https://discord.com/api/v9/channels/" + this.app.state.currentChannelId + "/messages";
        var body = { content: messageContent };

        this.app.apiService.fetch(url, {
            method: 'POST',
            body: JSON.stringify(body)
        })
            .then(function (res) {
                if (!res.ok) throw new Error("Failed to send message");
                this.app.uiManager.elements.messageInput.value = "";
                return this.fetchMessages();
            }.bind(this))
            .catch(function (error) {
                console.error("Error sending message:", error);
                this.app.uiManager.showError("Failed to send message. Please try again.");
            }.bind(this));
    };

    this.startMessageRefresh = function () {
        this.stopMessageRefresh();
        // fix: add timeout so it doesnt load twice 
        setTimeout(function () {
            this.app.state.refreshInterval = setInterval(this.checkNewMessages.bind(this), 5000);
        }.bind(this), 5000);
    };

    this.stopMessageRefresh = function () {
        if (this.app.state.refreshInterval) {
            clearInterval(this.app.state.refreshInterval);
            this.app.state.refreshInterval = null;
        }
    };

    this.resetAppState = function () {
        this.stopMessageRefresh();
        this.app.state.lastMessageId = null;
        this.app.uiManager.elements.messageArea.innerHTML = "";
    };
}

function MessageFormatter() {
    this.formatContent = function (content) {
        var sanitizedContent = content.replace(/<script(.*?)>/gi, "&lt;script$1&gt;")
            .replace(/<\/script>/gi, "&lt;/script&gt;");

        var linkedContent = sanitizedContent.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );

        linkedContent = linkedContent.replace(
            /<(a?):(\w+):(\d+)>/g,
            function (match, animated, name, id) {
                var ext = animated ? "gif" : "png";
                var emojiUrl = "https://cdn.discordapp.com/emojis/" + id + "." + ext;
                return '<img src="' + emojiUrl + '" alt=":' + name + ':" class="custom-emoji">';
            }
        );

        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = linkedContent;

        if (window.twemoji) {
            twemoji.base = 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/15.1.0/';

            twemoji.parse(tempDiv, {
                folder: 'svg',
                ext: '.svg',
                size: '72x72'
            });
        }

        return tempDiv.innerHTML;
    };
}