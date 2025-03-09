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

this.navigateBack = function() {
    if (this.app.state.currentView === 'server') {
        if (this.app.uiManager.elements.chatPopup.style.display === "flex") {
            var self = this;
            this.app.uiManager.hideChatPopup();
            
            setTimeout(function() {
                self.app.uiManager.hideChannelListOverlay();
                self.app.state.currentServerId = null;
                self.app.state.currentView = 'main';
                self.app.uiManager.elements.serverList.style.display = "block";
                self.app.uiManager.elements.channelList.style.display = "none";
            }, 300);
        } else {
            this.app.uiManager.hideChannelListOverlay();
            this.app.state.currentServerId = null;
            this.app.state.currentView = 'main';
            this.app.uiManager.elements.serverList.style.display = "block";
            this.app.uiManager.elements.channelList.style.display = "none";
        }
    } else {
        this.app.uiManager.hideChatPopup();
    }
    
    this.resetChatView();
};

    this.resetChatView = function () {
        this.app.uiManager.resetChatView();
        this.app.messageManager.resetAppState();
    };
}