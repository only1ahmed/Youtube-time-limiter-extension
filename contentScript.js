chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "blockWebpage") {
        const data = "You have exceeded your time for today!";
        console.log("Message received in content script:", data);
        // Remove all <style> elements
        const styleElements = document.querySelectorAll('style');
        styleElements.forEach(element => element.remove());

        // Remove all <link> elements that reference stylesheets
        const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
        linkElements.forEach(element => element.remove());
        document.body.innerHTML = `<p color='red'>${data}</p>`;
    }
    if (message.action === "reload") {
        // This will force the page to reload from the server
        location.reload(true);
    }
});
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed.');
    chrome.runtime.sendMessage({ action: "loaded" });
});
