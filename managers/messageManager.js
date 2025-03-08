//  handling message related operations
function MessageManager(app) {
    this.app = app;
    this.messageFormatter = new MessageFormatter();

    //the rest is obvious from the name
    this.fetchMessages = function() {
        if (!this.app.state.currentChannelId) return;

        this.app.uiManager.showLoading(true);

        var url = "https://discord.com/api/v9/channels/" + this.app.state.currentChannelId + "/messages?limit=50";
        
        this.app.apiService.fetch(url)
            .then(function(res) {
                if (!res.ok) throw new Error("Failed to fetch messages");
                return res.json();
            })
            .then(function(messages) {
                this.app.state.messages[this.app.state.currentChannelId] = messages;

                if (messages.length > 0) {
                    this.app.state.lastMessageId = messages[0].id;
                }

                this.renderMessages(messages);
                this.app.uiManager.showLoading(false);
            }.bind(this))
            .catch(function(error) {
                console.error("Error fetching messages:", error);
                this.app.uiManager.showError("Failed to load messages. Please try again.");
                this.app.uiManager.showLoading(false);
            }.bind(this));
    };


    this.checkNewMessages = function() {
        if (!this.app.state.currentChannelId || !this.app.state.lastMessageId) return;

        var url = "https://discord.com/api/v9/channels/" + this.app.state.currentChannelId + "/messages?after=" + this.app.state.lastMessageId;
        
        this.app.apiService.fetch(url)
            .then(function(res) {
                if (!res.ok) return;
                return res.json();
            })
            .then(function(newMessages) {
                if (newMessages && newMessages.length > 0) {
                    this.app.state.lastMessageId = newMessages[0].id;

                    var currentMessages = this.app.state.messages[this.app.state.currentChannelId] || [];
                    var reversedNewMessages = newMessages.slice().reverse();
                    
                    var updatedMessages = [];
                    for (var i = 0; i < reversedNewMessages.length; i++) {
                        updatedMessages.push(reversedNewMessages[i]);
                    }
                    for (var j = 0; j < currentMessages.length; j++) {
                        updatedMessages.push(currentMessages[j]);
                    }

                    this.app.state.messages[this.app.state.currentChannelId] = updatedMessages;
                    this.renderMessages(updatedMessages);
                }
            }.bind(this))
            .catch(function(error) {
                console.error("Error checking for new messages:", error);
            });
    };

   
    this.renderMessages = function(messages) {
        if (!messages || messages.length === 0) {
            this.app.uiManager.elements.messageArea.innerHTML = "<div class='message'>No messages in this channel yet. Start a conversation!</div>";
            return;
        }

        var sortedMessages = messages.slice();
        sortedMessages.sort(function(a, b) {
            return new Date(a.timestamp) - new Date(b.timestamp);
        });

        var messagesHtml = "";
        
        for (var i = 0; i < sortedMessages.length; i++) {
            var msg = sortedMessages[i];
            var avatarUrl = msg.author.avatar 
                ? "https://cdn.discordapp.com/avatars/" + msg.author.id + "/" + msg.author.avatar + ".png" 
                : "https://cdn.discordapp.com/embed/avatars/0.png";
        
            messagesHtml += '<div class="message">' +
                                '<img src="' + avatarUrl + '" class="avatar" alt="' + msg.author.username + '" />' +
                                '<div class="message-content">' +
                                    '<strong>' + msg.author.username + '</strong> ' + this.messageFormatter.formatContent(msg.content) +
                                '</div>' +
                            '</div>';
        }
        
        this.app.uiManager.elements.messageArea.innerHTML = messagesHtml;
        this.app.uiManager.elements.messageArea.scrollTop = this.app.uiManager.elements.messageArea.scrollHeight;
    };

 
    this.sendMessage = function() {
        var messageContent = this.app.uiManager.elements.messageInput.value.trim();
        if (!messageContent || !this.app.state.currentChannelId) return;

        var url = "https://discord.com/api/v9/channels/" + this.app.state.currentChannelId + "/messages";
        var body = { content: messageContent };

        this.app.apiService.fetch(url, {
            method: 'POST',
            body: JSON.stringify(body)
        })
        .then(function(res) {
            if (!res.ok) throw new Error("Failed to send message");
            this.app.uiManager.elements.messageInput.value = "";
            return this.fetchMessages();
        }.bind(this))
        .catch(function(error) {
            console.error("Error sending message:", error);
            this.app.uiManager.showError("Failed to send message. Please try again.");
        }.bind(this));
    };

  
    this.startMessageRefresh = function() {
        this.stopMessageRefresh();
        this.app.state.refreshInterval = setInterval(this.checkNewMessages.bind(this), 5000);
    };

   
    this.stopMessageRefresh = function() {
        if (this.app.state.refreshInterval) {
            clearInterval(this.app.state.refreshInterval);
            this.app.state.refreshInterval = null;
        }
    };


    this.resetAppState = function() {
        this.stopMessageRefresh();
        this.app.state.lastMessageId = null;
        this.app.uiManager.elements.messageArea.innerHTML = "";
    };
}

function MessageFormatter() {
    this.formatContent = function(content) {
        return content.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );
    };
}