// chrome.tabs.active();
var isEnabled;
var timeLeft;
var tabId;
scheduleReset();
chrome.tabs.onUpdated.addListener((tabID, tab) => {
    if (tab.url && tab.url.includes("youtube.com/")) {
        isEnabled = chrome.storage.sync.get('enabled');
        timeLeft = chrome.storage.sync.get('timeLeft');
        timeLimit = chrome.storage.sync.get('timeLimit');
        tabId = tabID;
        mainAction();

        // recieve toggle actions from the popup
        chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
            console.log("Received message:", message);
            if (message.action === "toggle") {
                isEnabled = !(isEnabled || false);
                chrome.storage.sync.set({ enabled: isEnabled }, () => {
                    console.log('Extension state is now:', isEnabled ? 'enabled' : 'disabled');
                });
                sendResponse({ isEnabled: isEnabled });
                if (isEnabled) {
                    timeLeft = chrome.storage.sync.get('timeLeft');
                    // signal the popup to prepare the view for the timer
                    sendResponse({ action: "viewTimer" });
                    //
                    mainAction();
                }
                else {
                    chrome.storage.sync.set({ timeLeft: timeLeft }, () => {
                        console.log('Time left is: ', timeLeft);
                    });
                    // signal the popup to hide timer
                    sendResponse({ enabled: isEnabled });

                }

            }
            if (message.action === "set time") {
                // if the user set the timelimit to a value less than the time he spent, then the timeleft will be 0
                timeLeft = Math.max(timeLeft + (message.timeLeft - timeLimit), 0);
                chrome.storage.sync.set({ timeLimit: message.timeLimit }, () => {
                    console.log('Time limit set to: ', message.timeLimit);
                });

                mainAction();

            }

            if (message.action === "isActivated") {

                sendResponse({ enabled: isEnabled });
                mainAction();

            }

            // sendResponse({ farewell: "goodbye" });

            // Return true if you want to send a response asynchronously
            return true;
        });


    }
});
// this handles the overlapping between async operations
// calling the function more than 1 time won't be a problem because it uses the same global variable (timeLeft), so whenever the timeLimit is changed, the function will keep running or will stop (depending on the timeLeft value)
let isRunning = false;

function mainAction() {
    // TODO: handle async calls
    if (isRunning) {
        return;
    }
    isRunning = true;
    if (isEnabled) {
        if (timeLeft === 0) {
            // message contentscript to edit the youtube page to prevent the user from accessing youtube
            blockWebpage();
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
                    chrome.storage.sync.set({ timeLeft: timeLeft });
                    return;
                }
                timeLeft--;

                if (timeLeft > 0) {

                    updateCountdownDisplay();


                } else {
                    clearInterval(countdownInterval);
                    chrome.storage.sync.set({ timeLeft: 0 });


                    // message contentscript to edit the youtube page to prevent the user from accessing youtube
                    blockWebpage();
                    // call the popup to display a message



                    countdownDisplay.innerHTML = "GET OFF THEM VIDEOS RIGHT NOW!!";


                }
            }, 1000);
        }
        else {
            // the popup shall ask for time input
            chrome.tabs.sendMessage(tabId, { action: "getTimeLimit" }, (response) => {
                timeLimit = response.timeLimit;
                timeLeft = response.timeLimit;
                chrome.storage.sync.set({ timeLimit: timeLimit });
                chrome.storage.sync.set({ timeLeft: timeLeft });
            });
        }
    }
    else {
        // popup shall have the activate toggle only
        // it is handled out of this scope
    }
    isRunning = false;
}

function updateCountdownDisplay() {
    chrome.tabs.sendMessage(tabId, { action: "updateCountdownDisplay", timeLeft: timeLeft });
}

function blockWebpage() {
    chrome.tabs.sendMessage(tabId, { action: "blockWebpage" });
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

    // Schedule the reset at midnight
    setTimeout(() => {
        timeLeft = chrome.storage.sync.get('timeLeft');
        chrome.storage.sync.set({ timeLeft: timeLeft });
        // Reschedule the action for the next midnight
        scheduleReset();
    }, timeUntilMidnight);
}