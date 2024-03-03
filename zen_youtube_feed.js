console.log("\n\ncontent_script loaded!!\n\n");

function listingBackgroundScript(message, sender, response) {
    if(message.type === "REQUESTED_DOM_INFO") {
        console.log(`Background Script requested DOM info..`);        
        
        var videos = getVideos();    
        var customHtml = orchestradeCreation(videos);        
        var originalHtml = document.querySelector(`[page-subtype="subscriptions"]`);
        
        console.log(customHtml);
        replaceHTMLContent(originalHtml, customHtml);        
        browser.runtime.sendMessage({ type: "USER_ACTION_FULFILLED", data: videos})
    }

    if(message.type === "REPLACE_HTML"){
        //var customHTML = orchestradeCreation();
        //replaceHTMLContent(customHTML);
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
                    url: video.children[0].children[0].children[0].children[2].children[1].children[0].children[1].href,
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
     htmlCard += `<a href=${video.url}>`
     htmlCard += `<div class="card">`;

     function image(){
        htmlCard += `<div class="card-image"><img src="${video.channel_image}" class="centered-image" alt="Profile Image"></div>`
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

     htmlCard += `</div>`;
     htmlCard += `</a>`;

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
    height: 60px;
    margin-bottom: 20px; /* Adjust spacing between cards */
    box-shadow: 0 0 14px rgba(0, 0, 0, 0.04);
    background-color: #fff;
    /* Add more styling as needed */
  }

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
    border-radius: 50%;
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
    })

    finalHtml += style;
    finalHtml += container;
    finalHtml += columns;
    finalHtml += cards;
    finalHtml += `</div>`;
    finalHtml += `</div>`;

    return finalHtml;
}

function replaceHTMLContent(originalHtml, customHTML) {    
    originalHtml.innerHTML = "";
    originalHtml.innerHTML = customHTML;
}

function checkClickEvent(event){    
    if(event.target.innerText === "Subscriptions") {                
        console.log("Subscription menu button was clicked!!!!");        
        var videos = getVideos();
        var customHtml = orchestradeCreation(videos); 
        var originalHtml = document.querySelector(`[page-subtype="subscriptions"]`);        
        replaceHTMLContent(originalHtml, customHtml);
    }
}

document.addEventListener("mouseup", checkClickEvent);
browser.runtime.sendMessage({ type: "PING" });
browser.runtime.onMessage.addListener(listingBackgroundScript);