console.log("bg script loaded!");
var sender_id = 0;

function listingDOM(message, sender, sendResponse){
    console.log("listening DOM trigger..");
    if(message.type === "PING") {
        sender_id = sender.tab.id;
        console.log(`Message type: ${message.type}`);
    }

    if(message.type === "USER_ACTION_FULFILLED"){        
        console.log(message.type);       
    }

}

function clickedExtension() {
    console.log(`User clicked on me!!`);

    function requestDOMInformation() {
        console.log(sender_id);
        browser.tabs.sendMessage(sender_id, { type: "REQUESTED_DOM_INFO" });
    }

    function nuke() {
        nukeDOM();
    }

    requestDOMInformation();
    //nuke();
}

function nukeDOM(){
    browser.tabs.query({ active: true, currentWindow: true })
        .then(tabs => {
            var activeTab = tabs[0];
            browser.tabs.sendMessage(activeTab.id, { type: "REPLACE_HTML" });         
        })
        .catch(error => console.error(`Error getting active tab: ${error}`));
}

browser.runtime.onMessage.addListener(listingDOM);
browser.browserAction.onClicked.addListener(clickedExtension);
