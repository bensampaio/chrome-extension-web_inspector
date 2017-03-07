const currentIcons = {};

const toggleIcon = (tab) => {
	const tabId = tab.id;

	if(!(tabId in currentIcons)) {
		resetTabIcon(tabId);
	}

	currentIcons[tabId] = !currentIcons[tabId];

	chrome.browserAction.setIcon({ path : "img/icon_" + (currentIcons[tabId]? "active" : "inactive") + '.png', tabId : tabId });

	chrome.tabs.executeScript({
		code: 'wi.current.toggleStatus()'
	});
}

const resetTabIcon = (tabId) => {
	currentIcons[tabId] = false;
}

// When extension icon is clicked
chrome.browserAction.onClicked.addListener(toggleIcon);

// When a new tab is created initializes its properties
chrome.tabs.onCreated.addListener((tab) => {
	resetTabIcon(tab.id);
});

// When a tab content is updated resets its properties
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	resetTabIcon(tabId);
});

// When a tab is removed removes its properties
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
	currentIcons[tabId] = null;
});

// When the extension interacts with the background page
chrome.extension.onRequest.addListener((request, sender) => {
	if(request && typeof request.action !== 'undefined' && sender && typeof sender.tab !== 'undefined') {
		switch(request.action) {
			case 'toggleIcon':
				toggleIcon(sender.tab);
			break;
		}
	}
});