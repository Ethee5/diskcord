// handling ui elements and interactions
function UIManager() {
    // list of elements
    this.elements = {
        messageArea: document.getElementById("messageArea"),
        messageInput: document.getElementById("messageInput"),
        sendButton: document.getElementById("sendMessageBtn"),
        serverList: document.getElementById("serverList"),
        channelList: document.getElementById("channelList"),
        dmList: document.getElementById("dmList"),
        backButton: document.getElementById("backButton"),
        sidebarTitle: document.getElementById("sidebarTitle"),
        headerTitle: document.getElementById("headerTitle"),
        loadingIndicator: document.getElementById("loadingIndicator"),
        sidebar: document.getElementById("sidebar"),
        content: document.querySelector(".content")
    };

    // toggle sidebar menu
    this.toggleMenu = function() {
        var sidebar = this.elements.sidebar;
        var isVisible = sidebar.className.indexOf("sidebar-visible") !== -1;
        
        if (isVisible) {
            sidebar.className = "sidebar";
        } else {
            sidebar.className = "sidebar sidebar-visible";
        }
        
        return !isVisible;
    };

    this.showLoading = function(isLoading) {
        this.elements.loadingIndicator.style.display = isLoading ? "block" : "none";
    };


    this.showError = function(message) {
        alert(message);
    };


    this.updateNavigation = function(view, title) {
        if (view === 'server') {
            this.elements.backButton.style.display = "block";
            this.elements.sidebarTitle.textContent = title;
        } else {
            this.elements.backButton.style.display = "none";
            this.elements.sidebarTitle.textContent = "Servers";
        }
    };

    this.resetChatView = function() {
        this.elements.headerTitle.textContent = "Disk Cord";
        this.elements.messageArea.innerHTML = "<div class='message'>Select a server or DM to start chatting</div>";
        this.elements.messageInput.disabled = true;
        this.elements.sendButton.disabled = true;
    };
}