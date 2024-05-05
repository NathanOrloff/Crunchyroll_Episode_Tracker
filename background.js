var series = "";

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
    if (request.type == "getSeries" ) {
        sendResponse({ type: request.type, data: series });
    } else if (request.type == "setSeries") {
        series = request.data;
    } else if (request.type == "createNotification") {

        // create browser notification with information sent
        browser.notifications.create({
            type: "basic",
            title: `Latest ${request.data.series} episode watched:`,
            message: request.data.episode
        });

        // on notification clicked, create new tab
        browser.notifications.onClicked.addListener(() => {
            let creating = browser.tabs.create({
                url: request.data.link,
            });
            creating.then(onCreated, onError);
        });
    }
});
