chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "iaChat",
    title: "Envoyer à l'IA",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === "iaChat") {
    chrome.windows.create({
      url: 'popup.html',
      type: 'popup',
      width: 400,
      height: 600
    });
  }
});
