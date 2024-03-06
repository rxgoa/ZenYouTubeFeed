(function() {


// this will prevent for this script to be injected more than one time.
// if we don't do this, we will have this script injected 2 times, and with that,
// all our listening triggers will be doubled.
if(window.hasRun) {
    return;
}

window.hasRun = true;

console.log("\n\ncontent_script loaded!!\n\n");

function listingBackgroundScript(message, sender, response) {

    if(message.type === "REQUESTED_DOM_INFO") {
        console.log(`Background Script requested DOM info..`);       
        process(); 
        //browser.runtime.sendMessage({ type: "USER_ACTION_FULFILLED" })
    }

    if(message.type === "EXTENSION_OPTION_CHANGED"){
        let shouldReloadWindow = setExtensionOption();
        console.log("Updating extension options..");

        if(shouldReloadWindow) {
            location.reload();
        } else {
            process();
        }
    }

    if(message.type === "OPTIONS_STORAGE_REQUESTED") {
        let optionsCached = localStorage.getItem('zen-options');
        if(optionsCached) {
            response(JSON.parse(optionsCached));
        } else {
            response({});
        }
    }

    if(message.type === "OPTIONS_STORAGE_CATEGORIES_UPDATED") {
        console.log("updating local storage for categories...");
        let localStorage = getLocalStorage('zen-options');
        if(localStorage.categories){
            localStorage.categories.push(message.data);
        } else {
            localStorage.categories = [];
            localStorage.categories.push(message.data);
        }

        setStorage(localStorage, 'zen-options');

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
            var videos = [];            
            for(let r = 0; r < rowsList.length; r++) {                
                var row = rowsList[r];
                if(row.nodeName === "YTD-RICH-GRID-ROW"){
                    for(let y = 0; y < row.children[0].children.length; y++) {
                        var video = row.children[0].children[y];       
                        
                        var default_image = video.children[0].children[0].children[0].children[2].children[0].children[0].children[0].currentSrc;
                        var videoObject = {
                            title: video.children[0].children[0].children[0].children[2].children[1].children[0].children[1].textContent,
                           url: video.children[0].children[0].children[0].children[2].children[1].children[0].children[1].href,
                           channel_image: default_image !== "" ? default_image : "",                        
                            channel_url: video.children[0].children[0].children[0].children[2].children[1].children[1].children[0].children[0].children[0].children[0].children[0].children[0].children[0].href,
                            channel_name: video.children[0].children[0].children[0].children[2].children[1].children[1].children[0].children[0].innerText,
                            date: video.children[0].children[0].children[0].children[2].children[1].children[1].children[0].children[1].innerText,
                            category: ""
                        };

                        videos.push(videoObject);
                    }
                }
            }

        return videos;

    }

    // in here i would create a logic to separete videos by category. Science, Vlogs etc
    function configureByCategory() {}
    var rows = getRows();
    var videosList = getVideosFromRowList(rows);
    var videosListWithImages = checkIfImageExist(videosList);

    return videosListWithImages;

}

function setChannelsCache(videos){

        var localStorage = getLocalStorage('zen-youtube-feed');
        videos.forEach(video => {
            var checkChannel = localStorage.findIndex(channel => channel.channel_url === video.channel_url);
            if(checkChannel === -1) {
                if(video.channel_image !== "") {
                    console.log("Setting channel cache.....");
                    localStorage.push({
                        name: video.channel_name,
                        image_url: video.channel_image,
                        channel_url: video.channel_url
                    });
               }
            }
        });

        setStorage(localStorage, 'zen-youtube-feed');

}

function checkIfImageExist(videos){

    var localStorage = getLocalStorage('zen-youtube-feed');

    if(localStorage.length > 0) {
        videos.forEach(video => {    
            var checkChannel = localStorage.findIndex(channel => channel.channel_url === video.channel_url);
            if(checkChannel !== -1) {
                if(video.channel_image === "") {
                    video.channel_image = localStorage[checkChannel].image_url;
                }
                if(localStorage[checkChannel].category) {
                    video.category = localStorage[checkChannel].category;
                }
            }
        });
    }

    return videos;

}

function setStorage(updatedStorage, storageName) {
    localStorage.setItem(storageName, JSON.stringify(updatedStorage));
}

function getLocalStorage(storageName){
    var storage = localStorage.getItem(storageName);
    if(storage && storage.length > 0) {
        var storageParsed = JSON.parse(storage);
        return storageParsed;
    } else {
        return {};
    }
}

function containerCreation(){
    var htmlContainer = '';
    htmlContainer += `<div class="scrollable-container">`;

    return htmlContainer;
}

// when implementa more than one column, im going to need to think better about how to close divs.
function columnsCreation(){
    var htmlColumn = '';
    htmlColumn += `<div class="column">`;

    function title() {
        htmlColumn += `<h2 class="column-title">_feed_</h2>`;
    }

    title();

    return htmlColumn;
}

function cardsCreation(video){
     var htmlCard = '';     
     htmlCard += `<div class="card">`;
     htmlCard += `<a href=${video.url}>`

     
     function image(){
        htmlCard += `<div class="card-image"><img src="${video.channel_image === "" || !video.channel_image ? 'https://i.pinimg.com/736x/04/47/8e/04478e52900c30a49c4d4e9a312725b3.jpg' : video.channel_image}" class="centered-image" alt="Profile Image"></div>`
     }

     function content() {
        htmlCard += `<div class="card-content">`;

        function title(){
            htmlCard += `<div class="card-title">${video.title}</div>`;

        }

        function time(){
            htmlCard += `<div class="card-time">${video.date}</div>`;
        }
        
        function channel(){
            htmlCard += `<div class="card-channel">${video.channel_name}</div>`;
        }

        title();
        time();
        channel();

        htmlCard += `</div>`;
     }

     image();
     content();


     htmlCard += `</a>`;          
     if(video.category && video.category !== "") {
        htmlCard += `<span class="pill">${video.category}</span>`;
     } else {
        let extensionOptions = getLocalStorage('zen-options');
        htmlCard += `
                <div class="dropdown">
                  <button class="dropbtn">Select Category ( ͡° ͜ʖ ͡°)</button>
                <div class="dropdown-content">
        `;
        extensionOptions.categories.forEach((category) => {
            htmlCard += `
                 <a href="#">${category.name}</a>
            `;

        });
        htmlCard += "</div>";
        htmlCard += "</div>";
     }
     htmlCard += `</div>`;

     return htmlCard;

}

function styleCreation(){
    var htmlStyle = '';
    htmlStyle += `
    <style>
  body {
    margin: 0;
    overflow: auto;
    background-color: white;
  }

  .scrollable-container {
    display: flex;
    overflow-x: auto;
    white-space: nowrap;
    padding: 20px;    
  }

  .column {
    flex-shrink: 0;
    width: 300px; /* Set your preferred column width */
    margin-right: 20px; /* Adjust spacing between columns */
    background-color: #F4FDFF;
    border-radius: 8px;
    padding: 20px;
  }

  .card {    
    border-radius: 8px;
    padding: 10px;
    min-height: 60px;
    max-height: 92px;
    margin-bottom: 20px; /* Adjust spacing between cards */
    box-shadow: 0 0 14px rgba(0, 0, 0, 0.04);
    background-color: #fff;
    /* Add more styling as needed */
  }

.pill {
    display: inline-block; /* Allows us to set padding and makes the element behave more like a block while staying in-line */
    padding: 4px 10px; /* Adjusts the size of the pill, increase or decrease as needed */
    color: black; /* Sets the text color */
    font-size: 8px; /* Sets the size of the text */
    margin-top: 10px;
    border-radius: 50px; /* Creates the rounded corners. A large value ensures fully rounded ends */
    text-align: center; /* Ensures the text is centered within the pill */
    background-color: #FFDFD3;
}

/* Container for the dropdown */
.dropdown {
  position: relative;
  display: inline-block;
  margin-top: 5px;
}

/* Button styling */
.dropbtn {
  background-color: #FF6961;
  color: black;
  padding: 4px 8px;
  font-size: 8px;
  border: none;
  cursor: pointer;
  border-radius: 20px; /* Pill-style button */
}

/* Dropdown content */
.dropdown-content {
  display: none;
  position: absolute;
  background-color: #f9f9f9;
  min-width: 30px;
  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
  z-index: 1;
}

/* Links inside the dropdown */
.dropdown-content a {
  color: black;
  padding: 12px 16px;
  text-decoration: none;
  display: block;
}

/* Hover effect for the links */
.dropdown-content a:hover {background-color:#D22B2B; color: white;}

/* Show the dropdown content on hover */
.dropdown:hover .dropdown-content {display: block}

/* Change the background of the button when the dropdown is clicked */
.dropdown:hover .dropbtn {background-color: #D22B2B;}

  .column a {
    text-decoration: none;
  }

  .column-title {
    font-size: 18px;
    margin-bottom: 10px;
    text-align: center;
    color: #151922;
  }

  .card-image {
    border-radius: 6px;
    overflow: hidden;
    width: 50px; /* Set your preferred image size */
    height: 50px; /* Set your preferred image size */
    float: left;
    position: relative;
    margin-right: 10px;
  }

  .centered-image {
    display: block;
    width: 100%;
    height: auto;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .card-content {
    overflow: hidden; /* Clearfix for the floated elements */
  }

  .card-title {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    margin-bottom: 10px;
    white-space: normal;
    height: 40px;
    font-size: 12px;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .card-time,
  .card-channel {
    width: 50%;
    box-sizing: border-box;
    float: left;
    font-weight: bold;
    color: #D22B2B;
    font-size: 10px;
  }

  .card-time {
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100px;
  }

  .card-channel {
    float: right;
    text-align: right;      
  }
</style>
    `;

    return htmlStyle;
}

function orchestradeCreation(videos){
    
        var finalHtml = '';
        var cards = '';

        var style = styleCreation();
        var container = containerCreation();
        var columns = columnsCreation();

        videos.forEach((video, index) => {
            var card = cardsCreation(video);
            cards += card;
        });

        finalHtml += style;
        finalHtml += container;
        finalHtml += columns;
        finalHtml += cards;
        finalHtml += `</div>`;
        finalHtml += `</div>`;

        return finalHtml;

}

function process() {
    setTimeout(() => {
        var videos = getVideos();
        // set cache of channels
        setChannelsCache(videos);
    
        var customHtml = orchestradeCreation(videos); 
        var originalHtml = document.querySelector(`[page-subtype="subscriptions"]`);        
        replaceHTMLContent(originalHtml, customHtml);
    }, 100);
}

function replaceHTMLContent(originalHtml, customHTML) {    
        // var setHiddenPageManager = document.querySelector("ytd-app")
        //     .querySelector("#content")
        //     .querySelector("ytd-page-manager");
        // setHiddenPageManager.style.visibility = "visible";
        originalHtml.innerHTML = "";
        originalHtml.innerHTML = customHTML;

}

function checkClickEvent(event){    
    if(event.target.innerText === "Subscriptions") {                
        console.log("Subscription menu button was clicked!!!!");
        //process();
    }
}

function checkExtension() {
    let extension = localStorage.getItem("zen-options");
    if(extension){
        let options = JSON.parse(extension);
        console.log("BBBBBBBBBBBBBBBBBBBBBBBBBBBB");
        console.log(options);
        return options;
    }

    return {};

}

function setExtensionOption() {        
    var options = checkExtension();
    var forceReloadWindow = false;
    var newOptions = {};
    if(options && options.isEnable) {
        options.isEnable = false;
        forceReloadWindow = true;
        newOptions = options;
    } else {
        options.isEnable = true;
        newOptions = options;
    }


    console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    console.log(newOptions);
    localStorage.setItem('zen-options', JSON.stringify(newOptions));
    
    return forceReloadWindow;
}

const targetElement = document.querySelector("ytd-app")
    .querySelector("#content")
    .querySelector("ytd-page-manager");                       

const observer = new MutationObserver((mutations) => {    
  let isExtensionEnabled = checkExtension();
  if(isExtensionEnabled.isEnable){

  if(mutations[0].addedNodes[0].nodeName === "YTD-BROWSE"){                
        console.log("[LOGGER] YTD-BROWSE CHANGE DETECTED");
        const primaryDOM = document.querySelector("ytd-app")
                                .querySelector("#content")
                                .querySelector("ytd-page-manager") 
                                .querySelector('[page-subtype="subscriptions"]')                     
                                .querySelector("ytd-two-column-browse-results-renderer")
                                .querySelector("#primary");
        
        const primaryObserver = new MutationObserver((mutationsSubscription) => {            
            // var setHiddenPageManager = document.querySelector("ytd-app")
            //             .querySelector("#content")
            //             .querySelector("ytd-page-manager");
            // setHiddenPageManager.style.visibility = "hidden";
            console.log("[LOGGER] PRIMARY_DOM CHANGE DETECTED");       
            const contentDOM = document.querySelector("ytd-app")
                                        .querySelector("#content")
                                        .querySelector("ytd-page-manager") 
                                        .querySelector('[page-subtype="subscriptions"]')                     
                                        .querySelector("ytd-two-column-browse-results-renderer")
                                        .querySelector("#primary")
                                        .querySelector("ytd-rich-grid-renderer")
                                        .querySelector("#contents");
            
            const contentObserver = new MutationObserver((mutationsContent) => {
                  console.log("[LOGGER] CONTENT_DOM CHANGE DETECTED");
                                       
                  process();
                  disconnectObserver(); 
            });

            contentObserver.observe(contentDOM, { childList: true, attributeOldValue: true, characterDataOldValue: true });
          
        });

        primaryObserver.observe(primaryDOM, { childList: true, attributeOldValue: true })

    }

    }
 
});

const config_observer = { childList: true, attributeOldValue: true };

function disconnectObserver() {
    observer.disconnect();
}

observer.observe(targetElement, config_observer);

document.addEventListener("mouseup", checkClickEvent);
browser.runtime.onMessage.addListener(listingBackgroundScript);
})();
