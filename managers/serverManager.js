//  handling server related operations
function ServerManager(app) {
    this.app = app;

    this.fetchServersAndDMs = function() {
        this.app.uiManager.showLoading(true);

        this.app.apiService.fetch("https://discord.com/api/v9/users/@me/guilds")
            .then(function(serverRes) {
                if (!serverRes.ok) throw new Error("Failed to fetch servers");
                return serverRes.json();
            })
            .then(function(servers) {
                this.renderServerList(servers);
                return this.app.apiService.fetch("https://discord.com/api/v9/users/@me/channels");
            }.bind(this))
            .then(function(dmRes) {
                if (!dmRes.ok) throw new Error("Failed to fetch DMs");
                return dmRes.json();
            })
            .then(function(dms) {
                this.renderDMList(dms);
                this.app.uiManager.showLoading(false);
            }.bind(this))
            .catch(function(error) {
                console.error("Error fetching data:", error);
                this.app.uiManager.showError("Failed to load servers and DMs. Please try again.");
                this.app.uiManager.showLoading(false);
            }.bind(this));
    };

    this.renderServerList = function(servers) {
        var serverHtml = "";
        
        for (var i = 0; i < servers.length; i++) {
            var server = servers[i];
            serverHtml += '<div class="item" onclick="app.serverManager.loadServerChannels(\'' + server.id + '\', \'' + server.name + '\')">' + server.name + '</div>';
        }
        
        this.app.uiManager.elements.serverList.innerHTML = serverHtml || "<div>No servers found</div>";
    };

    this.renderDMList = function(dms) {
        var dmHtml = "";
        
        for (var i = 0; i < dms.length; i++) {
            var dm = dms[i];
            var recipient = dm.recipients && dm.recipients.length > 0 ? dm.recipients[0] : null;
            if (recipient) {
                dmHtml += '<div class="item" onclick="app.channelManager.loadDM(\'' + dm.id + '\', \'' + recipient.id + '\', \'' + recipient.username + '\')">' + recipient.username + '</div>';
            }
        }
        
        this.app.uiManager.elements.dmList.innerHTML = dmHtml || "<div>No direct messages found</div>";
    };

    this.loadServerChannels = function(serverId, serverName) {
        this.app.messageManager.resetAppState();
        this.app.state.currentServerId = serverId;
        this.app.state.currentView = 'server';

        this.app.uiManager.showLoading(true);
        this.app.uiManager.updateNavigation('server', serverName);

        this.app.apiService.fetch("https://discord.com/api/v9/guilds/" + serverId + "/channels")
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
                    channelsHtml += '<div class="item" onclick="app.channelManager.loadChannel(\'' + serverId + '\', \'' + channel.id + '\', \'' + channel.name + '\')">#' + channel.name + '</div>';
                }

                this.app.uiManager.elements.channelList.innerHTML = channelsHtml || "<div>No text channels found</div>";
                this.app.uiManager.elements.channelList.style.display = "block";
                this.app.uiManager.elements.serverList.style.display = "none";

                this.app.uiManager.showLoading(false);
            }.bind(this))
            .catch(function(error) {
                console.error("Error fetching channels:", error);
                this.app.uiManager.showError("Failed to load channels. Please try again.");
                this.app.uiManager.showLoading(false);
            }.bind(this));
    };
}