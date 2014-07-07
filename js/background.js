var currentIcons = {};

var toggleIcon = function(tab) {
	var tabId = tab.id;

	if(!(tabId in currentIcons)) {
		resetTabIcon(tabId);
	}

	currentIcons[tabId] = !currentIcons[tabId];

	chrome.browserAction.setIcon({ path : "img/icon_" + (currentIcons[tabId]? "active" : "inactive") + '.png', tabId : tabId });

	chrome.tabs.executeScript({
		code: 'wi.current.toggleStatus()'
	});
}

var resetTabIcon = function(tabId) {
	currentIcons[tabId] = false;
}

// When extension icon is clicked
chrome.browserAction.onClicked.addListener(toggleIcon);

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

// When the extension interacts with the background page
chrome.extension.onRequest.addListener(function(request, sender) {
	if(request && typeof request.action !== 'undefined' && sender && typeof sender.tab !== 'undefined') {
		switch(request.action) {
			case 'toggleIcon':
				toggleIcon(sender.tab);
			break;
		}
	}
});