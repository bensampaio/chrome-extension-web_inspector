var currentIcons = {};

var resetTabIcon = function(tabId) {
	currentIcons[tabId] = false;
}

chrome.browserAction.onClicked.addListener(function(tab) {
	var tabId = tab.id;

	if(!(tabId in currentIcons)) {
		resetTabIcon(tabId);
	}

	currentIcons[tabId] = !currentIcons[tabId];

	chrome.browserAction.setIcon({ path : "img/icon_" + (currentIcons[tabId]? "active" : "inactive") + '.png', tabId : tabId });

	chrome.tabs.executeScript({
		code: 'wi.current.toggleStatus()'
	});
});

// When a new tab is created initializes its properties
chrome.tabs.onCreated.addListener(function(tab) {
	resetTabIcon(tab.id);
});

// When a tab content is updated resets its properties
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	resetTabIcon(tabId);
});

// When a tab is removed removes its properties
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
	currentIcons[tabId] = null;
});