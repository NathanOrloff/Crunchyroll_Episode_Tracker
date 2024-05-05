
// global variables
var oldHref = document.location.href;
var series = "";

// constants
const LOAD_TIMEOUT = 500;
const COOKIE_EXPIRE_DAYS = 365;
const COOKIE_BASE_NAME = "cr_episode_tracker"

// background script request types
const GET_SERIES = "getSeries";
const SET_SERIES = "setSeries";
const CREATE_NOTIFICATION = "createNotification";

/**
 * Logs the response from the background
 * @param {Object} message JSON response object returned from background
 */
function handleResponse(message) {
    if (!message) {
        return;
    }
    if (message.type == GET_SERIES) {
        series = message.data;
    } else {
        console.log(message);
    }
}
  
/**
 * Logs error message if message send fails
 * @param {String} error Error string returned
 */
function handleError(error) {
    console.log(`Error: ${error}`);
}

/**
 * Sends message to background script
 * @param {Object} data JSON object to send to backgroun
 */
function notifyBackgroundPage(type, data) {
    const msg = {type: type, data: data};
    const sending = browser.runtime.sendMessage(msg);
    sending.then(handleResponse, handleError);
}

/**
 * Handles new page visited
 */
function handleNewPage() {
    let location = document.location.href;
    const series_re = new RegExp(".*://.*.crunchyroll.com/series/.*");
    const watch_re = new RegExp(".*://.*.crunchyroll.com/watch/.*");
    let isSeriesPage = location.match(series_re);
    let isWatchPage = location.match(watch_re);
    setTimeout(() => {
        if (!isSeriesPage && !isWatchPage) {
            return;
        }
        const title = document.body.querySelector('h1');
        const titleText = title.outerText;
        if (isSeriesPage) {
            series = titleText;
            notifyBackgroundPage(SET_SERIES, series);
            series_cookie_name = series.replace(/\s/g, '').toLowerCase();

            // retrieve cookie if available
            let cookie = retrieveCRCookie(COOKIE_BASE_NAME);
            if (!cookie) {
                return;
            }

            let cookie_value = JSON.parse(cookie)[series_cookie_name];
            if (!cookie_value) {
                return;
            }

            // create popup
            notifyBackgroundPage(CREATE_NOTIFICATION, cookie_value);
        }
        else if (isWatchPage) {
            notifyBackgroundPage(GET_SERIES, "");
            if (!series) {
                return;
            }
            series_cookie_name = series.replace(/\s/g, '').toLowerCase()

            // format data
            let episode = titleText;
            let cookie_data = {
                series: series,
                episode: episode,
                link: location
            };

            // store/update cookie
            setCRCookie(series_cookie_name, cookie_data, COOKIE_EXPIRE_DAYS);
        }
    }, LOAD_TIMEOUT);
    
}

/**
 * Retrieves cookie value stored on browser
 * @param {String} cname Name of cookie to retrieve
 * @returns {String} Value of cookie that was stored or ""
 */
function retrieveCRCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}

/**
 * Sets cookie in browser for specified number of days
 * @param {String} cname Name of cookie being set
 * @param {Object} cvalue Value of cookie being set
 * @param {Number} exdays How many days the cookie will last
 */
function setCRCookie(cname, cvalue, exdays) {
    // get existing cookie if exists
    cookie = retrieveCRCookie(COOKIE_BASE_NAME);
    if (cookie) {
        cookie = JSON.parse(cookie);
        cookie[cname] = cvalue;
    } else {
        cookie = {[cname]: cvalue};
    }
    let str_cookie = JSON.stringify(cookie);

    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = COOKIE_BASE_NAME + "=" + str_cookie + ";" + expires + ";path=/";
}


window.onload = function() {
    handleNewPage();
    var bodyList = document.querySelector("body")

    let observer = new MutationObserver(function(mutations) {
        if (oldHref != document.location.href) {
            oldHref = document.location.href;
            handleNewPage();
        }
    });
    
    var config = {
        childList: true,
        subtree: true
    };
    
    observer.observe(bodyList, config);
};

