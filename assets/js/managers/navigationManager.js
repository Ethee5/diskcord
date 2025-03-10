// handling navigation related operations
function NavigationManager(app) {
    this.app = app;

    this.handleHashChange = function () {
        var hash = window.location.hash.substring(1);

        if (hash.startsWith("guild-")) {
            var parts = hash.split("/");
            if (parts.length > 1) {
                var serverId = parts[0].substring(6);
                var channelId = parts[1];
                this.app.channelManager.loadChannelFromHash(serverId, channelId);
            }
        } else if (hash.startsWith("dm-")) {
            var userId = hash.split("-")[1];
            this.app.channelManager.loadDmFromHash(userId);
        }
    };

    this.navigateBack = function () {
        this.resetChatView();
        
        if (this.app.state.currentView === 'server') {
            var isChatVisible = this.app.uiManager.elements.chatPopup.style.display === "flex";
            
            if (isChatVisible) {
                var self = this;

                this.app.uiManager.hideChatPopup();

                setTimeout(function () {
                    self._returnToServerList();
                }, 300);
            } else {
                this._returnToServerList();
            }
        } else {
            this.app.uiManager.hideChatPopup();
        }
    };

    this._returnToServerList = function() {
        this.app.uiManager.hideChannelListOverlay();
        this.app.state.currentServerId = null;
        this.app.state.currentView = 'main';

        var display = {
            serverList: "block",
            channelList: "none"
        };

        Object.keys(display).forEach(function(key) {
            this.app.uiManager.elements[key].style.display = display[key];
        }, this);
    };

    this.resetChatView = function () {
        this.app.uiManager.resetChatView();
        this.app.messageManager.resetAppState();
    };
}