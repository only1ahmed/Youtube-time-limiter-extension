const testing = false;
document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.getElementById('timeSubmit');
    submitButton.addEventListener('click', submitTime);
});


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
