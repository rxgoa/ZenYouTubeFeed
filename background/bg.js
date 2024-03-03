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
        console.log(message);
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
    nuke();
}

function nukeDOM(){
    browser.tabs.query({ active: true, currentWindow: true })
        .then(tabs => {
            var activeTab = tabs[0];
            var customContentURL = `browser.extension.getURL("zen.html")`;
            browser.tabs.sendMessage(activeTab.id, { type: "REPLACE_HTML", customHTML: customContentURL});
            // fetch(customContentURL)
            //     .then(response => response.text())
            //     .then(customHTML => {
            //         browser.tabs.sendMessage(activeTab.id, { type: "REPLACE_HTML", customHTML});
            //         // send message to the content_script people                   
            //     })
            //     .catch(error => console.error(`Error fetching custom content: ${error}`));

        })
        .catch(error => console.error(`Error getting active tab: ${error}`));
}

browser.runtime.onMessage.addListener(listingDOM);
browser.browserAction.onClicked.addListener(clickedExtension);

/*

    body --> <ytd-app> --> div id="content" --> <ytd-page-manager id="page-manager"> --> <ytd-browse> --> 
    <ytd-two-column-browse-results-renderer page-subtype="subscriptions"> --> <div id="primary"> -->
    <ytd-rich-grid-renderer> --> <div id="contents"> --> inside this element we have all the videos from the
    subscription feed,separeted by rows.

*/