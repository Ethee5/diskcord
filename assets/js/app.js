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

        // setup event listeners
        this.setupEventListeners();
        
        // load initial data
        this.serverManager.fetchServersAndDMs();

        // URL hash
        window.addEventListener("hashchange", this.navigationManager.handleHashChange.bind(this.navigationManager));
        this.navigationManager.handleHashChange();
    };

    // setup event listeners
    this.setupEventListeners = function() {
        this.uiManager.elements.messageInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                this.messageManager.sendMessage();
            }
        }.bind(this));
    };

    // logging out
    this.logout = function() {
        localStorage.removeItem("discordToken");
        window.location.href = "login.html";
    };
}