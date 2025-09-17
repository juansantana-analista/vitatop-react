cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/cordova-plugin-inappbrowser/www/inappbrowser.js",
        "id": "cordova-plugin-inappbrowser.inappbrowser",
        "pluginId": "cordova-plugin-inappbrowser",
        "clobbers": [
            "cordova.InAppBrowser.open"
        ]
    },
    {
        "file": "plugins/cordova-plugin-inappbrowser/src/browser/InAppBrowserProxy.js",
        "id": "cordova-plugin-inappbrowser.InAppBrowserProxy",
        "pluginId": "cordova-plugin-inappbrowser",
        "runs": true
    },
    {
        "file": "plugins/cordova-plugin-navigationbar-color/www/navigationbar.js",
        "id": "cordova-plugin-navigationbar-color.navigationbar",
        "pluginId": "cordova-plugin-navigationbar-color",
        "clobbers": [
            "window.NavigationBar"
        ]
    },
    {
        "file": "plugins/cordova-plugin-navigationbar-color/src/browser/NavigationBarProxy.js",
        "id": "cordova-plugin-navigationbar-color.NavigationBarProxy",
        "pluginId": "cordova-plugin-navigationbar-color",
        "runs": true
    },
    {
        "file": "plugins/cordova-plugin-QRCode/www/QRCode.js",
        "id": "cordova-plugin-QRCode.QRCode",
        "pluginId": "cordova-plugin-QRCode",
        "clobbers": [
            "QRCode"
        ]
    },
    {
        "file": "plugins/cordova-plugin-statusbar/www/statusbar.js",
        "id": "cordova-plugin-statusbar.statusbar",
        "pluginId": "cordova-plugin-statusbar",
        "clobbers": [
            "window.StatusBar"
        ]
    },
    {
        "file": "plugins/cordova-plugin-statusbar/src/browser/StatusBarProxy.js",
        "id": "cordova-plugin-statusbar.StatusBarProxy",
        "pluginId": "cordova-plugin-statusbar",
        "runs": true
    },
    {
        "file": "plugins/es6-promise-plugin/www/promise.js",
        "id": "es6-promise-plugin.Promise",
        "pluginId": "es6-promise-plugin",
        "runs": true
    },
    {
        "file": "plugins/cordova-plugin-x-socialsharing/www/SocialSharing.js",
        "id": "cordova-plugin-x-socialsharing.SocialSharing",
        "pluginId": "cordova-plugin-x-socialsharing",
        "clobbers": [
            "window.plugins.socialsharing"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-plugin-browsersync-gen2": "1.1.7",
    "cordova-plugin-firebasex": "16.5.0",
    "cordova-plugin-inappbrowser": "6.0.0",
    "cordova-plugin-navigationbar-color": "0.0.8",
    "cordova-plugin-QRCode": "1.1.2-dev",
    "cordova-plugin-statusbar": "4.0.0",
    "es6-promise-plugin": "4.2.2",
    "cordova-plugin-x-socialsharing": "6.0.4"
}
// BOTTOM OF METADATA
});