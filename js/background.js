chrome.browserAction.onClicked.addListener(function() {
	chrome.tabs.executeScript({
		code: 'wi.toggleStatus()'
	});
});