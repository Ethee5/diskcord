// main 
var app; // global app instance

document.addEventListener('DOMContentLoaded', function() {
    // initialize
    app = new DiskcordApp();
    app.init();
    
    // global functions required for ui events
    window.navigateBack = function() {
        app.navigationManager.navigateBack();
    };
    
    window.logout = function() {
        app.logout();
    };

    window.closeChatPopup = function() {
        app.uiManager.hideChatPopup();
    };
});