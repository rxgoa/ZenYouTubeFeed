// this dude will gather information about the dom and send to the background script.
console.log("\n\ncontent_script loaded!!\n\n");

// i need to check why im getting information about videos from the homepage.
// i need to use in a session without other extension?


// i think i neeed to implement the messaging exchange between background script and content_scripts
// maybe the problem is coming from this.. maybe the home page video is showing because its when i load???

                         
                         

// var objectToShow = {
//     title: videosGrid[0],
//     date_string: videosGrid[0],
//     channel_name: videosGrid[0]
// };
// id -> 22

function listingBackgroundScript(message, sender, response) {
    if(message.type === "REQUESTED_DOM_INFO") {
        console.log(`Background Script requested DOM info..`);        
        
        var videos = getVideos();          
        browser.runtime.sendMessage({ type: "USER_ACTION_FULFILLED", data: videos})
    }

    if(message.type === "REPLACE_HTML"){
        replaceHTMLContent(message.customHTML);
    }
}

function getVideos() {    

    // responsible for getting an list of rows
    function getRows() {
        var rows = document.querySelector("ytd-app")
                        .querySelector("#content")
                        .querySelector("ytd-page-manager") 
                        .querySelector('[page-subtype="subscriptions"]')                        
                        .querySelector("ytd-two-column-browse-results-renderer")
                        .querySelector("#primary")
                        .querySelector("ytd-rich-grid-renderer")
                        .querySelector("#contents")
                        .querySelectorAll("ytd-rich-grid-row");  

        return rows;
    }

    // function responsible for getting all the videos from an specific row
    function getVideosFromRowList(rowsList) {
        //var rowsList = Array.from(rows);
        console.log("\n\nGetting list of videos from rows...\n\n");
        var videos = [];
        
        rowsList.forEach((row, index) => {
            var videosRowList = Array.from(row.children[0].children); // list of videos                
            videosRowList.forEach((video, indexVideo) => {
                var default_image = video.children[0].children[0].children[0].children[2].children[0].children[0].children[0].currentSrc;
                var videoObject = {
                    title: video.children[0].children[0].children[0].children[2].children[1].children[0].children[1].textContent,
                    channel_image: default_image !== "" ? default_image : "https://i.pinimg.com/736x/04/47/8e/04478e52900c30a49c4d4e9a312725b3.jpg",
                    channel_name: video.children[0].children[0].children[0].children[2].children[1].children[1].children[0].children[0].innerText,
                    date: video.children[0].children[0].children[0].children[2].children[1].children[1].children[0].children[1].innerText,
                    category: "DEFAULT_CATEGORY"
                };                
                videos.push(videoObject);
            });
        });

        return videos;
    }

    // in here i would create a logic to separete videos by category. Science, Vlogs etc
    function configureByCategory() {}

    var rows = getRows();
    var videosList = getVideosFromRowList(rows);

    return videosList;
}

function replaceHTMLContent(customHTML) {
    document.body.innerHTML = customHTML;
}

function checkClickEvent(event){    
    if(event.target.innerText === "Subscriptions") {                
        console.log("Subscription menu button was clicked!!!!");        
        var videos = getVideos();
        replaceHTMLContent();
    }
}

document.addEventListener("mouseup", checkClickEvent);
browser.runtime.sendMessage({ type: "PING" });
browser.runtime.onMessage.addListener(listingBackgroundScript);