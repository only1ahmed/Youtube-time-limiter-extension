// chrome.tabs.active();
var isEnabled;
var timeLeft;
var tabsids = new Set();
let isRunning = false;

console.log("this is the start of the service worker");

isEnabled = chrome.storage.local.get('enabled').enabled;
timeLeft = chrome.storage.local.get('timeLeft').timeLeft;
timeLimit = chrome.storage.local.get('timeLimit').timeLimit;
console.log("the beginning data: ");
console.log("enabled: ", isEnabled);
console.log("time left: ", timeLeft);
console.log("time limit: ", timeLimit);
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        if (tab.url.includes("youtube.com")) {
            console.log("YouTube is loaded:", tab.url);
            tabsids.add(tabId);
        }
    }
});
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    tabsids.delete(tabId);
    console.log(`Tab with ID ${tabId} removed. Current open tabs:`, tabsids);
});
scheduleReset();
console.log("tab triggered enabled: ", isEnabled);
console.log("tab triggered time left: ", timeLeft);
console.log("tab triggered time limit: ", timeLimit);
console.log("starting tab routine..");
routine();

const countdownInterval = setInterval(() => {
    // check continusly to activate the block
    if (isEnabled) {
        mainAction();
    }
}, 1000);




// chrome.webNavigation.onCommitted.addListener((details) => {
//     if (details.frameId === 0) { // Main frame
//         if (details.tabId === tabId) {
//             console.log("starting navigation routine..");
//             routine();
//         }
//     }
// }, { url: [{ hostContains: 'youtube.com' }] }); // Adjust to match the URLs you want to monitor







// this handles the overlapping between async operations
// calling the function more than 1 time won't be a problem because it uses the same global variable (timeLeft), so whenever the timeLimit is changed, the function will keep running or will stop (depending on the timeLeft value)

function mainAction() {
    console.log("main action running..");
    console.log("main action running while extension is enabled: ", isEnabled);
    console.log("main action running while mainaction is running: ", isRunning);
    // TODO: handle async calls
    if (isRunning) {
        return;
    }
    isRunning = true;
    if (isEnabled) {
        if (timeLeft === 0) {
            // message contentscript to edit the youtube page to prevent the user from accessing youtube
            console.log("time is up before, you should blockwebpage..");
            isRunning = 0;
            console.log("done main action because time left is 0..");
            blockWebpage();
            return;
        }
        else if (timeLeft > 0) {
            // start the timer

            // const countdownDisplay = document.getElementById("countdownDisplay");
            // Display the countdown
            updateCountdownDisplay();
            console.log(timeLeft, 'time left');
            const countdownInterval = setInterval(() => {
                // at any point of time, if the toggle swtich is off, stop the countdown and save the timeleft into the memory
                if (!isEnabled) {
                    clearInterval(countdownInterval);
                    chrome.storage.local.set({ timeLeft: timeLeft });
                    isRunning = false;
                    return;
                }
                timeLeft--;

                if (timeLeft > 0) {

                    updateCountdownDisplay();


                } else {
                    clearInterval(countdownInterval);
                    chrome.storage.local.set({ timeLeft: 0 });


                    // message contentscript to edit the youtube page to prevent the user from accessing youtube
                    blockWebpage();
                    // call the popup to display a message


                }
            }, 1000);
        }
        else {
            // // the popup shall ask for time input
            // console.log("getting time limit..");
            // chrome.runtime.sendMessage({ action: "getTimeLimit" }, (response) => {
            //     // timeLimit = response.timeLimit;
            //     // timeLeft = response.timeLimit;
            //     // chrome.storage.local.set({ timeLimit: timeLimit });
            //     // chrome.storage.local.set({ timeLeft: timeLeft });
            // });

        }
    }
    else {
        // popup shall have the activate toggle only
        // it is handled out of this scope
    }
    console.log("done main action..");
    isRunning = false;
}

function updateCountdownDisplay() {
    console.log("update countdown display from background..");
    chrome.runtime.sendMessage({ action: "viewTimer" });
    chrome.runtime.sendMessage({ action: "updateCountdownDisplay", timeLeft: timeLeft });
}

function blockWebpage() {
    for (let tab of tabsids) {
        chrome.tabs.sendMessage(tab, { action: "blockWebpage" });
    }
}

function getTimeUntilMidnight() {
    const now = new Date();

    // Calculate time until the next midnight
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0); // Set to 12:00 AM of the next day

    return nextMidnight - now;
}

function scheduleReset() {
    const timeUntilMidnight = getTimeUntilMidnight();
    console.log("time till the next reset: ", timeUntilMidnight);
    // Schedule the reset at midnight
    setTimeout(() => {
        timeLeft = chrome.storage.local.get('timeLimit').timeLimit;
        chrome.storage.local.set({ timeLeft: timeLeft });
        // Reschedule the action for the next midnight
        scheduleReset();
    }, timeUntilMidnight);
}

function routine() {

    // recieve toggle actions from the popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log("Received message:", message);
        if (message.action === "loaded") {
            mainAction();
        }
        if (message.action === "toggle") {
            console.log("isEnabled before: ", isEnabled);
            isEnabled = !(isEnabled || false);
            console.log("isEnabled after: ", isEnabled);

            if (isEnabled) {
                // timeLeft = chrome.storage.local.get('timeLeft').timeLeft;
                // timeLimit = chrome.storage.local.get('timeLimit').timeLimit;
                console.log("times", timeLeft, timeLimit);
                // signal the popup to prepare the view for the timer
                if (timeLimit && timeLimit > 0) {
                    sendResponse({ action: "viewTimer" });
                }
                else if (timeLimit === undefined) {
                    console.log("timeLimit is undefined..");
                    sendResponse({ action: "viewTimeInput" });
                }
                else {
                    sendResponse({ action: "unknown" });
                    console.log("How am i here..");
                }
                mainAction();
            }
            else {
                sendResponse({ enabled: isEnabled });
                chrome.storage.local.set({ timeLeft: timeLeft }, () => {
                    console.log('Time left is: ', timeLeft);
                });
            }
            chrome.storage.local.set({ enabled: isEnabled }, () => {
                console.log('Extension state is now:', isEnabled ? 'enabled' : 'disabled');
            });
        }
        if (message.action === "setTime") {
            // if the user set the timelimit to a value less than the time he spent, then the timeleft will be 0
            timeLeft = Math.max((timeLeft || 0) + (message.timeLimit - (timeLimit || 0)), 0);
            console.log("new time left:", timeLeft);
            timeLimit = message.timeLimit;
            chrome.storage.local.set({ timeLimit: message.timeLimit }, () => {
                console.log('Time limit set to: ', message.timeLimit);
            });


        }

        if (message.action === "isActivated") {
            console.log("popup asking for whether the extension is enabled or not..");
            sendResponse({ enabled: (isEnabled || false) });
        }
        if (message.action === "settings") {


        }
        // sendResponse({ farewell: "goodbye" });

        // Return true if you want to send a response asynchronously
        return true;
    });
}