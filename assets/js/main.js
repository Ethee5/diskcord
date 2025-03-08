// main 
var app; // global app instance

document.addEventListener('DOMContentLoaded', function() {
    // initialize
    app = new DiskcordApp();
    app.init();
    
    // global functions required for ui events
    window.toggleMenu = function() {
        var isVisible = app.uiManager.toggleMenu();
        app.state.sidebarVisible = isVisible;
    };
    
    window.navigateBack = function() {
        app.navigationManager.navigateBack();
    };
    
    window.logout = function() {
        app.logout();
    };
});