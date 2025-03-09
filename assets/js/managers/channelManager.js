// handling channel related operations
function ChannelManager(app) {
    this.app = app;

    // load the channel (duh)
    this.loadChannel = function(serverId, channelId, channelName) {
        this.app.messageManager.resetAppState();
        this.app.state.currentChannelId = channelId;
        this.app.state.currentServerId = serverId;
        this.app.state.currentView = 'server';

        window.location.hash = "#guild-" + serverId + "/" + channelId;

<<<<<<< Updated upstream
        this.app.uiManager.elements.headerTitle.textContent = "#" + channelName;
=======
        this.app.uiManager.elements.chatTitle.innerHTML = twemoji.parse("#" + channelName);

>>>>>>> Stashed changes
        this.app.uiManager.elements.messageInput.disabled = false;
        this.app.uiManager.elements.sendButton.disabled = false;

        this.app.messageManager.fetchMessages();
        this.app.messageManager.startMessageRefresh();
    };

    // load DM (duh)
    this.loadDM = function(dmChannelId, userId, username) {
        this.app.messageManager.resetAppState();
        this.app.state.currentChannelId = dmChannelId;
        this.app.state.currentDmUserId = userId;
        this.app.state.currentView = 'dm';

        window.location.hash = "#dm-" + userId;

        this.app.uiManager.elements.headerTitle.textContent = "DM: " + username;
        this.app.uiManager.elements.messageInput.disabled = false;
        this.app.uiManager.elements.sendButton.disabled = false;

        this.app.messageManager.fetchMessages();
        this.app.messageManager.startMessageRefresh();
    };

    // load the channel from hash
    this.loadChannelFromHash = function(serverId, channelId) {
        this.app.apiService.fetch("https://discord.com/api/v9/channels/" + channelId)
            .then(function(res) {
                if (!res.ok) throw new Error("Failed to fetch channel info");
                return res.json();
            })
            .then(function(channel) {
                this.loadChannel(serverId, channelId, channel.name);
            }.bind(this))
            .catch(function(error) {
                console.error("Error loading channel from hash:", error);
            });
    };

    // load the dm from hash
    this.loadDmFromHash = function(userId) {
        this.app.apiService.fetch("https://discord.com/api/v9/users/@me/channels")
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
                    this.loadDM(dm.id, userId, dm.recipients[0].username);
                }
            }.bind(this))
            .catch(function(error) {
                console.error("Error loading DM from hash:", error);
            });
    };
}