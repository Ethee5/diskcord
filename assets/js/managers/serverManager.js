// handling server related operations
function ServerManager(app) {
    this.app = app;

    this.fetchServersAndDMs = function () {
        this.app.uiManager.showLoading(true);

        this.app.apiService.fetch("https://discord.com/api/v9/users/@me/guilds")
            .then(function (serverRes) {
                if (!serverRes.ok) throw new Error("Failed to fetch servers");
                return serverRes.json();
            })
            .then(function (servers) {
                this.renderServerList(servers);
                return this.app.apiService.fetch("https://discord.com/api/v9/users/@me/channels");
            }.bind(this))
            .then(function (dmRes) {
                if (!dmRes.ok) throw new Error("Failed to fetch DMs");
                return dmRes.json();
            })
            .then(function (dms) {
                this.renderDMList(dms);
                this.app.uiManager.showLoading(false);
            }.bind(this))
            .catch(function (error) {
                console.error("Error fetching data:", error);
                this.app.uiManager.showError("Failed to load servers and DMs. Please try again.");
                this.app.uiManager.showLoading(false);
            }.bind(this));
    };

    this.renderServerList = function (servers) {
        var serverHtml = "";

        for (var i = 0; i < servers.length; i++) {
            var server = servers[i];
            var iconUrl;
            if (server.icon) {
                iconUrl = "https://cdn.discordapp.com/icons/" + server.id + "/" + server.icon + ".png";
            } else {
                iconUrl = "assets/img/default-server.png";
            }

            serverHtml += '<div class="item" onclick="app.serverManager.loadServerChannels(\'' + server.id + '\', \'' + server.name.replace(/'/g, "\\'") + '\')">' +
                '<img src="' + iconUrl + '" class="server-icon"> ' + server.name + '</div>';
        }

        this.app.uiManager.elements.serverList.innerHTML = serverHtml || "<div>No servers found</div>";
    };

    



    this.renderDMList = function (dms) {
        var dmHtml = "";

        dms.sort(function (a, b) {
            return (b.last_message_id || "0") - (a.last_message_id || "0");
        });

        for (var i = 0; i < dms.length; i++) {
            var dm = dms[i];
            var recipient = dm.recipients && dm.recipients.length > 0 ? dm.recipients[0] : null;
            if (recipient) {
                var avatarUrl = recipient.avatar
                    ? "https://cdn.discordapp.com/avatars/" + recipient.id + "/" + recipient.avatar + ".png"
                    : "assets/img/default-avatar.png";

                dmHtml += '<div class="item" onclick="app.channelManager.loadDM(\'' + dm.id + '\', \'' + recipient.id + '\', \'' + recipient.username + '\')">' +
                    '<img src="' + avatarUrl + '" class="user-avatar"> ' + recipient.username +
                    '</div>';
            }
        }

        this.app.uiManager.elements.dmList.innerHTML = dmHtml || "<div>No direct messages found</div>";
    };





    this.loadServerChannels = function (serverId, serverName) {
        this.app.messageManager.resetAppState();
        this.app.state.currentServerId = serverId;
        this.app.state.currentView = 'server';

        this.app.uiManager.showLoading(true);
        this.app.uiManager.updateNavigation('server', serverName);

        this.app.apiService.fetch("https://discord.com/api/v9/guilds/" + serverId + "/channels")
            .then(function (res) {
                if (!res.ok) throw new Error("Failed to fetch channels");
                return res.json();
            })
            .then(function (channels) {
                var categories = {};
                var uncategorizedChannels = [];

                channels.sort(function (a, b) { return a.position - b.position; });

                for (var i = 0; i < channels.length; i++) {
                    var channel = channels[i];
                    if (channel.type === 4) {
                        categories[channel.id] = { name: channel.name, channels: [] };
                    } else if (channel.parent_id && categories[channel.parent_id]) {
                        categories[channel.parent_id].channels.push(channel);
                    } else {
                        uncategorizedChannels.push(channel);
                    }
                }

                var channelsHtml = "";

                // categorized channels
                var categoryKeys = Object.keys(categories);
                for (var j = 0; j < categoryKeys.length; j++) {
                    var category = categories[categoryKeys[j]];
                    channelsHtml += "<div class='category'>" + category.name + "</div>";
                    for (var k = 0; k < category.channels.length; k++) {
                        var ch = category.channels[k];
                        channelsHtml += "<div class='item' onclick=\"app.channelManager.loadChannel('" + serverId + "', '" + ch.id + "', '" + ch.name + "')\">#" + ch.name + "</div>";
                    }
                }

                // uncategorized channels
                if (uncategorizedChannels.length > 0) {
                    channelsHtml += "<div class='category'>Uncategorized</div>";
                    for (var m = 0; m < uncategorizedChannels.length; m++) {
                        var ch = uncategorizedChannels[m];
                        channelsHtml += "<div class='item' onclick=\"app.channelManager.loadChannel('" + serverId + "', '" + ch.id + "', '" + ch.name + "')\">#" + ch.name + "</div>";
                    }
                }

                this.app.uiManager.elements.channelList.innerHTML = channelsHtml || "<div>No channels found</div>";
                this.app.uiManager.elements.channelList.style.display = "block";
                this.app.uiManager.elements.serverList.style.display = "none";

                this.app.uiManager.showLoading(false);
            }.bind(this))
            .catch(function (error) {
                console.error("Error fetching channels:", error);
                this.app.uiManager.showError("Failed to load channels. Please try again.");
                this.app.uiManager.showLoading(false);
            }.bind(this));
    };
}