// content.js
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.message === "getSelectedText") {
      const selectedText = window.getSelection().toString();
      sendResponse({text: selectedText});
    } else if (request.message === "replaceSelectedText") {
      const selectedText = window.getSelection();
      selectedText.deleteFromDocument();
      selectedText.getRangeAt(0).insertNode(document.createTextNode(request.responseText));
    } else if (request.message === "getSelectedTextForPopup") {
      const selectedText = window.getSelection().toString();
      chrome.runtime.sendMessage({message: "selectedText", text: selectedText});
      sendResponse({text: selectedText});
    }
  }
);

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === "iaChat") {
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      function: function() {
        chrome.runtime.sendMessage({message: "getSelectedTextForPopup"}, function(response) {
        });
      }
    });
  }
});
