const testing = false;
document.addEventListener('DOMContentLoaded', () => {
    var allData;
    const toggleButton = document.getElementById('toggleButton');
    // get the initial state
    chrome.runtime.sendMessage({ action: "isActivated" }, function (response) {
        console.log("Response from background:", response);
        toggleButton.checked = response.enabled || false;
    });
    const submitButton = document.getElementById('timeSubmit');
    const countdownDisplay = document.getElementById("countdownDisplay");
    submitButton.addEventListener('click', submitTime);
    toggleButton.addEventListener('change', () => {
        console.log("toggling button in popup.js..");
        toggleState(toggleButton);

    });
    console.log(toggleButton);

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log("message recieved from background: ", message.action);
        if (message.action === "getTimeLimit") {
            document.getElementById('timerSet').removeAttribute('hidden');
        }
        if (message.action === "viewTimer") {
            document.getElementById('timerSet').setAttribute('hidden', '');
            document.getElementById('countdownDisplay').removeAttribute('hidden');
        }
        if (message.action === "viewTimeInput") {
            console.log("response from background \"viewtimeinput\" recieved successfully");
            document.getElementById('timerSet').removeAttribute('hidden');
            document.getElementById('countdownDisplay').setAttribute('hidden', '');
        }
        if (message.action === "updateCountdownDisplay") {
            updateCountdownDisplay(message.timeLeft);
        }
        // unnecssary
        sendResponse({ enabled: toggleButton.checked });
    });
});


function toggleState(toggleButton) {
    let isEnabled = toggleButton.checked;
    console.log("toggle button is now: ", isEnabled);
    chrome.runtime.sendMessage({ action: "toggle" }, (response) => {
        // console.log("toggle button is now: ", isEnabled);
        if (isEnabled) {
            if (response.action === "viewTimer") {
                document.getElementById('timerSet').setAttribute('hidden', '');
                document.getElementById('countdownDisplay').removeAttribute('hidden');
            }
            if (response.action === "viewTimeInput") {
                console.log("response from background \"viewtimeinput\" recieved successfully");
                document.getElementById('timerSet').removeAttribute('hidden');
                console.log("showed the timeinput");
                document.getElementById('countdownDisplay').setAttribute('hidden', '');
                console.log("hided the countdown");
            }



        }
        else {
            if (response.action == "hideTimer") {
                console.log("Extension down, hide timer and the timerset and reload the page..");
                document.getElementById('timerSet').setAttribute('hidden', '');
                document.getElementById('countdownDisplay').setAttribute('hidden', '');
            }

        }
    });

}


function submitTime() {

    const hoursInput = parseInt(document.getElementById("hoursInput").value) || 0;
    const minutesInput = parseInt(document.getElementById("minutesInput").value) || 0;
    let totalTimeInSeconds = (hoursInput * 3600) + (minutesInput * 60);
    if (testing) {
        totalTimeInSeconds = minutesInput;
    }
    if (totalTimeInSeconds > 0) {
        chrome.runtime.sendMessage({ action: "setTime", timeLimit: totalTimeInSeconds }, function (response) {
            console.log("Response from background:", response);
        });
    } else {
        alert("Please enter a valid time greater than 0.");
    }
}

function updateCountdownDisplay(timeLeft) {
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    document.getElementById("countdownDisplay").innerHTML =
        `Time left: ${hours}h ${minutes}m ${seconds}s`;
}



// :root {
//     --label-width: 200px;
//     --label-height: 100px;
//     --label-border-radius:100px;
//     --after-top: 5px;
//     --after-left: 5px;
//     --after-width: 90px;
//     --after-height: 90px;
//     --after-border-radius: 90px;
//     --active-after-width: 130px;
//   }

// activation button
document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const sz = 50; // Base width in pixels
    root.style.setProperty('--label-width', `${sz}px`);
    root.style.setProperty('--label-height', `${sz/2}px`);
    root.style.setProperty('--label-border-radius', `${sz/2}px`);
    root.style.setProperty('--after-top', `${sz/40}px`);
    root.style.setProperty('--after-left', `${sz/40}px`);
    root.style.setProperty('--after-width', `${sz / (20/9)}px`);
    root.style.setProperty('--after-height', `${sz/ (20/9)}px`);
    root.style.setProperty('--after-border-radius', `${sz/ (20/9)}px`);
    root.style.setProperty('--active-after-width', `${sz/ (20/13)}px`);
  });