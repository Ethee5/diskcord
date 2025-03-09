//  handling message related operations
function MessageManager(app) {
    this.app = app;
    this.messageFormatter = new MessageFormatter();

    //the rest is obvious from the name
    this.fetchMessages = function() {
        if (!this.app.state.currentChannelId) return;
    
        this.app.uiManager.showLoading(true);
    
        var requestUrl = "https://discord.com/api/v9/channels/" + this.app.state.currentChannelId + "/messages?limit=50";
        
        this.app.apiService.fetch(requestUrl)
            .then(function(res) {
                if (!res.ok) throw new Error("Failed to fetch messages");
                return res.json();
            })
            .then(function(messages) {
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
                if (!newMessages || newMessages.length === 0) return;
                
                var currentMessages = this.app.state.messages[this.app.state.currentChannelId] || [];
                var currentMessageIds = new Set(currentMessages.map(function(msg) { return msg.id; }));

                var uniqueNewMessages = newMessages.filter(function(msg) {
                    return !currentMessageIds.has(msg.id);
                });
                
                if (uniqueNewMessages.length === 0) return;

                var reversedNewMessages = uniqueNewMessages.slice().reverse();

                if (reversedNewMessages.length > 0) {
                    this.app.state.lastMessageId = reversedNewMessages[reversedNewMessages.length - 1].id;
                }

                this.app.state.messages[this.app.state.currentChannelId] = currentMessages.concat(reversedNewMessages);

                this.renderMessages(this.app.state.messages[this.app.state.currentChannelId]);
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
        // fix: add timeout so it doesnt load twice (still broken tho)
        setTimeout(function() {
            this.app.state.refreshInterval = setInterval(this.checkNewMessages.bind(this), 5000);
        }.bind(this), 5000); 
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