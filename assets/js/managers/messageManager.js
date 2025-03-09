//handling message related operations
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

                uniqueNewMessages.sort(function(a, b) {
                    return new Date(a.timestamp) - new Date(b.timestamp);
                });
    
                if (uniqueNewMessages.length > 0) {
                    this.app.state.lastMessageId = uniqueNewMessages[uniqueNewMessages.length - 1].id;
                }

                for (var k = 0; k < uniqueNewMessages.length; k++) {
                    currentMessages.push(uniqueNewMessages[k]);
                }
                
                this.app.state.messages[this.app.state.currentChannelId] = currentMessages;

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

        var messagesContainer;
        var firstRender = false;
        
        messagesContainer = this.app.uiManager.elements.messageArea.querySelector('.messages-container');
        if (!messagesContainer) {
            messagesContainer = document.createElement('div');
            messagesContainer.className = 'messages-container';
            this.app.uiManager.elements.messageArea.innerHTML = '';
            this.app.uiManager.elements.messageArea.appendChild(messagesContainer);
            firstRender = true;
        }

        var wasAtBottom = this.isNearBottom(this.app.uiManager.elements.messageArea);

        for (var i = 0; i < sortedMessages.length; i++) {
            var msg = sortedMessages[i];
            var messageId = msg.id;

            var existingMessage = null;
            var messageElements = messagesContainer.getElementsByClassName('message');
            for (var j = 0; j < messageElements.length; j++) {
                if (messageElements[j].getAttribute('data-message-id') === messageId) {
                    existingMessage = messageElements[j];
                    break;
                }
            }
            
            if (!existingMessage) {
                var avatarUrl = msg.author.avatar 
                    ? "https://cdn.discordapp.com/avatars/" + msg.author.id + "/" + msg.author.avatar + ".png" 
                    : "https://cdn.discordapp.com/embed/avatars/0.png";
                
                var newMessage = document.createElement('div');
                newMessage.className = 'message';
                newMessage.setAttribute('data-message-id', messageId);
                
                var avatar = document.createElement('img');
                avatar.src = avatarUrl;
                avatar.className = 'avatar';
                avatar.alt = msg.author.username;
                
                var content = document.createElement('div');
                content.className = 'message-content';
                
                var authorName = document.createElement('strong');
                authorName.textContent = msg.author.username;
                
                content.appendChild(authorName);
                content.appendChild(document.createTextNode(' ' + msg.content));

                content.innerHTML = authorName.outerHTML + ' ' + this.messageFormatter.formatContent(msg.content);
                
                newMessage.appendChild(avatar);
                newMessage.appendChild(content);

                messagesContainer.appendChild(newMessage);
            } else {
                var contentElement = existingMessage.querySelector('.message-content');
                var newContent = '<strong>' + msg.author.username + '</strong> ' + this.messageFormatter.formatContent(msg.content);

                if (contentElement.innerHTML !== newContent) {
                    contentElement.innerHTML = newContent;
                }
            }
        }

        if (firstRender || wasAtBottom) {
            this.app.uiManager.elements.messageArea.scrollTop = this.app.uiManager.elements.messageArea.scrollHeight;
        }
    };

    this.isNearBottom = function(element) {
        return element.scrollHeight - element.scrollTop - element.clientHeight < 50;
    };

    this.isScrolledToBottom = function() {
        var element = this.app.uiManager.elements.messageArea;
        return element.scrollHeight - element.scrollTop - element.clientHeight < 50;
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
        // fix: add timeout so it doesnt load twice 
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