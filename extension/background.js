

chrome.browserAction.onClicked.addListener(tab => {
  chrome.windows.create({
    url: 'traffic.html',
    type: 'popup',
    width: 800,
    height: 600
  });
});
