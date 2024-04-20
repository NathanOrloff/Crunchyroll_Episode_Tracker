
/**
 * Logs id of tab created
 * @param {Object} tab 
 */
function onCreated(tab) {
    console.log(`Created new tab: ${tab.id}`);
}

/**
 * Logs error data
 * @param {String} error 
 */
function onError(error) {
    console.log(`Error: ${error}`);
}


browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // create browser notification with information sent
    browser.notifications.create({
        type: "basic",
        title: `Latest ${request.series} episode watched:`,
        message: request.episode
    });

    // on notification clicked, create new tab
    browser.notifications.onClicked.addListener(() => {
        let creating = browser.tabs.create({
            url: request.link,
        });
        creating.then(onCreated, onError);
    });
    sendResponse({ response: "success" });
});
