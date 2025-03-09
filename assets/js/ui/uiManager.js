// handling ui elements and interactions
function UIManager() {
    // list of elements
    this.elements = {
        messageArea: document.getElementById("messageArea"),
        messageInput: document.getElementById("messageInput"),
        sendButton: document.getElementById("sendMessageBtn"),
        serverList: document.getElementById("serverList"),
        channelList: document.getElementById("channelList"),
        channelListContainer: document.getElementById("channelListContainer"),
        dmList: document.getElementById("dmList"),
        backButton: document.getElementById("backButton"),
        serverTitle: document.getElementById("serverTitle"),
        chatTitle: document.getElementById("chatTitle"),
        headerTitle: document.getElementById("headerTitle"),
        loadingIndicator: document.getElementById("loadingIndicator"),
        mainContent: document.getElementById("mainContent"),
        chatPopup: document.getElementById("chatPopup"),
        tabButtons: document.getElementsByClassName("tablink")

    };


    this.showChannelListOverlay = function () {
        this.elements.channelListContainer.style.display = "flex";
        this.elements.channelListContainer.classList.add('hidden');
        document.querySelector(".tab-container").style.display = "none";

        for (var i = 0; i < this.elements.tabButtons.length; i++) {
            this.elements.tabButtons[i].style.display = "none";
        }

        void this.elements.channelListContainer.offsetWidth;

        this.elements.channelListContainer.classList.remove('hidden');
        this.elements.channelListContainer.classList.add('slide-in');
    };

    this.hideChannelListOverlay = function () {
        var self = this;

        this.elements.channelListContainer.classList.remove('slide-in');
        this.elements.channelListContainer.classList.add('slide-out');

        setTimeout(function () {
            self.elements.channelListContainer.style.display = "none";
            self.elements.channelListContainer.classList.remove('slide-out');
            document.querySelector(".tab-container").style.display = "flex";

            for (var i = 0; i < self.elements.tabButtons.length; i++) {
                self.elements.tabButtons[i].style.display = "block";
            }
        }, 300);
    };

    this.showChatPopup = function () {
        this.elements.chatPopup.style.display = "flex";
        this.elements.chatPopup.classList.add('hidden');

        for (var i = 0; i < this.elements.tabButtons.length; i++) {
            this.elements.tabButtons[i].style.opacity = "0.5";
        }

        void this.elements.chatPopup.offsetWidth;

        this.elements.chatPopup.classList.remove('hidden');
        this.elements.chatPopup.classList.add('slide-in');
    };

    this.hideChatPopup = function () {
        var self = this;

        this.elements.chatPopup.classList.remove('slide-in');
        this.elements.chatPopup.classList.add('slide-out');

        setTimeout(function () {
            self.elements.chatPopup.style.display = "none";
            self.elements.chatPopup.classList.remove('slide-out');

            for (var i = 0; i < self.elements.tabButtons.length; i++) {
                self.elements.tabButtons[i].style.opacity = "1";
            }
        }, 300);
    };

    this.showLoading = function (isLoading) {
        this.elements.loadingIndicator.style.display = isLoading ? "block" : "none";
    };

    this.showError = function (message) {
        alert(message);
    };

    this.updateNavigation = function (view, title) {
        if (view === 'server') {
            this.showChannelListOverlay();
            this.elements.serverTitle.textContent = title;
        } else {
            this.hideChannelListOverlay();
        }
    };

    this.resetChatView = function () {
        this.elements.messageInput.disabled = true;
        this.elements.sendButton.disabled = true;
        this.hideChatPopup();
    };
}

window.openPage = function (pageName, elmnt, color) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].style.backgroundColor = "";
    }
    document.getElementById(pageName).style.display = "block";
    elmnt.style.backgroundColor = color;

    if (app && app.uiManager) {
        app.uiManager.hideChannelListOverlay();
    }
};

window.closeChatPopup = function () {
    app.uiManager.hideChatPopup();
};
window.navigateBack = function () {
    app.navigationManager.navigateBack();
};

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("defaultOpen").click();
});

document.getElementById("uploadButton").addEventListener("click", function () {
    document.getElementById("fileInput").click();
});

