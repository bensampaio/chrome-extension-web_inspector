var currentIcon = {};

var resetTabIcon = function(tabId) {
	currentIcon[tabId] = -1;
}

chrome.browserAction.onClicked.addListener(function(tab) {
	var tabId = tab.id;

	if(!(tabId in currentIcon)) {
		resetTabIcon(tabId);
	}

	chrome.browserAction.setIcon({ path : "img/icon_" + (currentIcon[tabId] > 0? "inactive" : "active") + '.png', tabId : tabId });

	chrome.tabs.executeScript({
		code: 'wi.toggleStatus()'
	});

	currentIcon[tabId]*= -1;
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
	delete currentIcon[tabId];
});