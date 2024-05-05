chrome.runtime.onSuspend.addListener(function() {
    // 阻止插件关闭
    return true;
});