apiToken=window.localStorage.getItem('api_token')


msg={}
msg.apiToken=apiToken
chrome.runtime.sendMessage(msg, function(response) {
});
