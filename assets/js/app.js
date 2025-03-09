// main file to load everything
function DiskcordApp() {
    // state of the app on launch
    this.state = {
        token: localStorage.getItem("discordToken"),
        currentChannelId: null,
        currentServerId: null,
        currentDmUserId: null,
        currentView: 'main', 
        lastMessageId: null,
        refreshInterval: null,
        messages: {},
        sidebarVisible: false 
    };

    // inlcude the services
    this.apiService = new ApiService(this.state.token);
    this.uiManager = new UIManager();
    this.serverManager = new ServerManager(this);
    this.channelManager = new ChannelManager(this);
    this.messageManager = new MessageManager(this);
    this.navigationManager = new NavigationManager(this);

    // initalize the app
    this.init = function() {
        if (!this.state.token) {
            window.location.href = "index.html";
            return;
        }

        // clear the hash on page load to avoid loading whatever was opened last session
        if (window.location.hash) {
            history.replaceState(null, null, ' ');
        }

        // setup event listeners
        this.setupEventListeners();
        
        // load initial data
        this.serverManager.fetchServersAndDMs();

        // open the default tab
        document.getElementById("defaultOpen").click();

        // URL hash
        var self = this;
        window.addEventListener("hashchange", function() {
            self.navigationManager.handleHashChange();
        });
    };

    // setup event listeners
    this.setupEventListeners = function() {
        var self = this;
        this.uiManager.elements.messageInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                self.messageManager.sendMessage();
            }
        });
    };

    // logging out
    this.logout = function() {
        localStorage.removeItem("discordToken");
        window.location.href = "index.html";
    };
}