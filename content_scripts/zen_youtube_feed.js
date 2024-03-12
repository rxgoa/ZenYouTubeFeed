(function () {


    // this will prevent for this script to be injected more than one time.
    // if we don't do this, we will have this script injected 2 times, and with that,
    // all our listening triggers will be doubled.
    if (window.hasRun) {
        return;
    }

    window.hasRun = true;

    console.log("[LOGGER]CONTENT_SCRIPT LOADED.");

    /**
     * 
     * 
     * LISTENERS GOES HERE
     * 
     * 
     */

    function listingBackgroundScript(message, sender, response) {
        if (message.type === "REQUESTED_DOM_INFO") {
            process();
            //browser.runtime.sendMessage({ type: "USER_ACTION_FULFILLED" })
        }

        if (message.type === "EXTENSION_OPTION_CHANGED") {
            let shouldReloadWindow = setExtensionOption();

            if (shouldReloadWindow) {
                location.reload();
            } else {
                process();
            }
        }

        if (message.type === "OPTIONS_STORAGE_REQUESTED") {
            let optionsCached = localStorage.getItem('zen-options');
            if (optionsCached) {
                response(JSON.parse(optionsCached));
            } else {
                response({});
            }
        }

        if (message.type === "OPTIONS_STORAGE_CATEGORIES_UPDATED") {
            let localStorage = getLocalStorage('zen-options');
            if (localStorage.categories) {
                localStorage.categories.push(message.data);
            } else {
                localStorage.categories = [];
                localStorage.categories.push(message.data);
            }

            setStorage(localStorage, 'zen-options');

        }

        if(message.type === "YOUTUBE_FEED_SUBSCRIPTION_PAGE") {
            console.log("[LOGGER] YOUTUBE_FEED_SUBSCRIPTION_PAGE");
            console.log(message);
            customVideoPlayer();
        }

    }

    /**
     * 
     * SCRIPT_LOGIC GOES HERE.
     * THIS IS THE PLACE WHERE ALL THE LOGIC BEHIND THE EXTENSION HAPPENS.
     * MAIN FUNCTIONS
     * 
     */

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
            for (let r = 0; r < rowsList.length; r++) {
                var row = rowsList[r];
                if (row.nodeName === "YTD-RICH-GRID-ROW") {
                    for (let y = 0; y < row.children[0].children.length; y++) {
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

        var rows = getRows();
        var videosList = getVideosFromRowList(rows);
        var videosListWithImages = checkIfImageExist(videosList);

        return videosListWithImages;

    }

    /**
     * 
     * 
     * LOCAL_STORAGE GOES HERE
     * 
     * 
     */    
    function checkIfImageExist(videos) {
        var localStorage = getLocalStorage('zen-youtube-feed');

        if (localStorage.length > 0) {
            videos.forEach(video => {
                var checkChannel = localStorage.findIndex(channel => channel.channel_url === video.channel_url);
                if (checkChannel !== -1) {
                    if (video.channel_image === "") {
                        video.channel_image = localStorage[checkChannel].image_url;
                    }
                    if (localStorage[checkChannel].category) {
                        video.category = localStorage[checkChannel].category;
                    }
                }
            });
        }

        return videos;

    }
    
    function checkExtension() {
        let extension = localStorage.getItem("zen-options");
        if (extension) {
            let options = JSON.parse(extension);
            return options;
        }
        return {};
    }

    function insertNewColumnOptionStorage(column) {
        let optionsStorage = getLocalStorage('zen-options');
        if (optionsStorage) {
            if (optionsStorage.columns) {
                column.order = optionsStorage.columns.length + 1;
                // checks if column already exists in config storage 
                let checkIfAlreadyExist = optionsStorage.columns.filter(storageColumn => storageColumn.name === column.name);
                if (checkIfAlreadyExist.length === 0) {
                    optionsStorage.columns.push(column);
                }
            } else {
                optionsStorage.columns = [];
                column.order = 2;
                optionsStorage.columns.push(column);
            }
        }
        setStorage(optionsStorage, 'zen-options');
    }

    function setChannelCategory(updatedChannel) {
        let localStorage = getLocalStorage('zen-youtube-feed');
        localStorage.forEach((channel) => {
            if (channel.name === updatedChannel.name) {
                channel.category = updatedChannel.category;
            }
        });
        setStorage(localStorage, 'zen-youtube-feed');

    }

    function setStorage(updatedStorage, storageName) {
        localStorage.setItem(storageName, JSON.stringify(updatedStorage));
    }

    function getLocalStorage(storageName) {
        var storage = localStorage.getItem(storageName);
        if (storage && storage.length > 0) {
            var storageParsed = JSON.parse(storage);
            return storageParsed;
        } else {
            if (storageName === 'zen-youtube-feed') {
                return [];
            } else if (storageName === 'zen-options') {
                return {};
            }
        }
    }

    function setChannelsCache(videos) {
        var localStorage = getLocalStorage('zen-youtube-feed');
        videos.forEach(video => {
            var checkChannel = localStorage.findIndex(channel => channel.channel_url === video.channel_url);
            if (checkChannel === -1) {
                if (video.channel_image !== "") {
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

    /**
     * 
     * 
     * HTML DOM MANIPULATION GOES HERE.
     * 
     * 
     */

    function updateChannelCategoryDOM(event, channelName) {
        event.srcElement.parentNode.parentNode.children[0].innerHTML = `<button class="dropbtn">${event.target.textContent}</button>`;
        // update localStorage channel
        let allChannelVideos = Array.from(document.getElementsByClassName("card-channel"));


        let onlyCurrentChannelVideos = allChannelVideos.filter(video => video.textContent === channelName);
        onlyCurrentChannelVideos.forEach((channel) => {
            //channel.parentNode.parentNode.parentNode.children[1].children[1]
            channel.parentNode.parentNode.parentNode.children[1].children[0].innerHTML = `<button class="dropbtn">${event.target.textContent}</button>`;
        });
    }

    function containerCreation() {
        var htmlContainer = '';
        htmlContainer += `<div class="scrollable-container">`;

        return htmlContainer;
    }

    function setExtensionOption() {
        var options = checkExtension();
        var forceReloadWindow = false;
        var newOptions = {};
        if (options && options.isEnable) {
            options.isEnable = false;
            forceReloadWindow = true;
            newOptions = options;
        } else {
            options.isEnable = true;
            newOptions = options;
        }

        localStorage.setItem('zen-options', JSON.stringify(newOptions));

        return forceReloadWindow;
    }
    
    function columnsCreation(isNew) {
        let columns = getLocalStorage('zen-options');

        var htmlColumn = '';

        function title(name, videos) {
            htmlColumn += `<div class="column">`;
            htmlColumn += `<h2 class="column-title">${name}</h2>`;
            videos.forEach(video => {
                var card = cardsCreation(video);
                htmlColumn += card;
            });
            htmlColumn += `</div>`;
        }

        function dropdown(category) {
            if (!category) {
                category = {};
            }
            htmlColumn += createDropdown(category);
        }

        function loadCategory() {
            htmlColumn += `<button class="new-column-load-btn">Load Category</button>`;
        }

        if (isNew) {
            dropdown({});
            loadCategory();
        } else {
            let videos = getVideos();
            if (columns.columns) {
                let videosWithoutCategory = videos.filter(video => !video.category || video.category === "");
                
                title("_feed_", videosWithoutCategory);

                columns.columns.forEach((column) => {

                    htmlColumn += `<div class="column">`;

                    dropdown({ category: column.name });
                    loadCategory();

                    let videosWithCategory = videos.filter(video => video.category);                

                    videosWithCategory.forEach((video) => {
                        if (video.category === column.name) {
                            var card = cardsCreation(video);
                            htmlColumn += card;
                        }
                    });

                    htmlColumn += `</div>`;

                });
            } else {

                title("_feed_");

            }
        }

        return htmlColumn;

    }

    function cardsCreation(video) {
        var htmlCard = '';
        htmlCard += `<div class="card">`;
        htmlCard += `<a href=${video.url}>`


        function image() {
            htmlCard += `<div class="card-image"><img src="${video.channel_image === "" || !video.channel_image ? 'https://i.pinimg.com/736x/04/47/8e/04478e52900c30a49c4d4e9a312725b3.jpg' : video.channel_image}" class="centered-image" alt="Profile Image"></div>`
        }

        function content() {
            htmlCard += `<div class="card-content">`;

            function title() {
                htmlCard += `<div class="card-title">${video.title}</div>`;

            }

            function time() {
                htmlCard += `<div class="card-time">${video.date}</div>`;
            }

            function channel() {
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
        let dropdown = createDropdown(video);
        htmlCard += dropdown;


        htmlCard += `</div>`;

        return htmlCard;

    }

    function createDropdown(video) {
        let extensionOptions = getLocalStorage('zen-options');
        let htmlCard = `
                <div class="dropdown">
                  <button class="dropbtn">${video.category && video.category !== "" ? video.category : "Select Category ( ͡° ͜ʖ ͡°)"}</button>
                <div class="dropdown-content">
      `;

        extensionOptions.categories.forEach((category) => {
            if (video.category !== category.name) {
                htmlCard += `
                    <a class="categorySelection">${category.name}</a>
               `;
            }
        });

        htmlCard += "</div>";
        htmlCard += "</div>";

        return htmlCard;
    }

    function orchestradeCreation(videos) {
        var finalHtml = '';
        var cards = '';

        var style = styleCreation();
        var container = containerCreation();
        var newColumnBtn = `<div class="new-column"><button class="new-column-btn">New column</button></div>`;
        var columns = columnsCreation();

        finalHtml += style;
        finalHtml += newColumnBtn;
        finalHtml += container;
        finalHtml += columns;

        // insert cards in each column
        finalHtml += cards;
        finalHtml += `</div>`;
        finalHtml += `</div>`;

        return finalHtml;

    }

    function replaceHTMLContent(originalHtml, customHTML) {
        originalHtml.innerHTML = "";
        originalHtml.innerHTML = customHTML;
    }

    function checkClickEvent(event) {
        if (event.srcElement.className === "categorySelection") {
            let channelName = event.srcElement.parentNode.parentNode.parentNode.children[0].children[1].children[2].textContent;

            updateChannelCategoryDOM(event, channelName);

            setChannelCategory({
                name: channelName,
                category: event.target.textContent
            });
        }

        if (event.target.className === "new-column-btn") {
            createNewColumn(event.target.textContent);
        }

        if (event.target.innerTEXT !== "Select Category ( ͡° ͜ʖ ͡°)" && event.srcElement.className === "categorySelection") {
            insertNewColumnOptionStorage({ name: event.target.innerHTML });
        }

    }

    function createNewColumn(columnName) {
        let container = document.getElementsByClassName("scrollable-container")[0];
        let newColumn = columnsCreation(true);

        container.insertAdjacentHTML("beforeend", newColumn);

    }

    const targetElement = document.querySelector("ytd-app")
        .querySelector("#content")
        .querySelector("ytd-page-manager");

    const observer = new MutationObserver((mutations) => {
        let isExtensionEnabled = checkExtension();
        if (isExtensionEnabled.isEnable) {

            if (mutations[0].addedNodes[0].nodeName === "YTD-BROWSE") {
                console.log("[LOGGER] YTD-BROWSE CHANGE DETECTED");
                const primaryDOM = document.querySelector("ytd-app")
                    .querySelector("#content")
                    .querySelector("ytd-page-manager")
                    .querySelector('[page-subtype="subscriptions"]')
                    .querySelector("ytd-two-column-browse-results-renderer")
                    .querySelector("#primary");

                const primaryObserver = new MutationObserver((mutationsSubscription) => {
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

    // main function    
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

    function styleCreation() {
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
        overflow-x: scroll;
        white-space: nowrap;
        width: 100%;
        padding: 20px;    
        height: 88vh;
        scrollbar-color: #D22B2B #F6FBFC;
        scrollbar-width: auto;
    }
    .new-column {
        width: 300px;
        height: 30px;
        padding: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .column {
        flex-shrink: 0;
        width: 300px; /* Set your preferred column width */
        margin-right: 20px; /* Adjust spacing between columns */
        background-color: rgba(244, 251, 252, 0.8);
        border: rgba(182, 175, 172, 0.03) 3px solid;
        border-radius: 8px;
        padding: 20px;
        overflow-y: scroll;
        scrollbar-color: #D22B2B #F6FBFC;
        scrollbar-width: thin;
    }

    .card {    
        border-radius: 8px;
        padding: 10px;
        min-height: 60px;
        max-height: 98px;
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

    .dropdown {
    position: relative;
    display: inline-block;
    margin-top: 5px;
    margin-bottom: 20px;
    }

    /* Button styling */
    .dropbtn {
    background-color: #FFDFD3;
    color: #333;
    padding: 8px 16px;
    font-size: 10px;
    font-weight: bold;
    border: none;
    cursor: pointer;
    border-radius: 20px; /* Pill-style button */
    }

    .new-column-load-btn {
    background-color: #D22B2B;
    color: white;
    border: none;
    padding: 8px 10px;
    font-size: 10px;
    font-weight: bold;
    margin-left: 10px;
    border-radius: 5px;
    cursor: pointer;
    outline: none;
    transition: background-color 0.3s ease, transform 0.2s ease;
    }

    .new-column-load-btn:hover {
    background-color: #c11a1a;
    transform: translateY(-2px);
    }

    .new-column-load-btn:active {
    transform: translateY(1px);
    }

    .dropdown-content {
    display: none;
    position: absolute;
    background-color: #f9f9f9;
    min-width: 30px;
    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
    z-index: 1;
    }

    .dropdown-content a {
    color: black;
    padding: 10px 16px;
    text-decoration: none;
    display: block;
    }

    .dropdown-content a:hover {background-color:#D22B2B; color: white;}

    .dropdown:hover .dropdown-content {display: block}

    .dropdown:hover .dropbtn {background-color: #D22B2B;}

    .column a {
        text-decoration: none;
    }

    .column-title {
        font-size: 18px;
        margin-bottom: 30px;
        text-align: center;
        color: #151922;
    }

    .categorySelection {
        cursor: pointer;
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

    .new-column-btn {
    background-color: #D22B2B;
    color: white;
    border: none;
    padding: 10px 20px;
    font-size: 16px;
    font-weight: bold;
    border-radius: 5px;
    cursor: pointer;
    outline: none;
    transition: background-color 0.3s ease, transform 0.2s ease;
    }

    .new-column-btn:hover {
    background-color: #c11a1a;
    transform: translateY(-2px);
    }

    .new-column-btn:active {
    transform: translateY(1px);
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

    const config_observer = { childList: true, attributeOldValue: true };

    function disconnectObserver() {
        observer.disconnect();
    }

    observer.observe(targetElement, config_observer);

    document.addEventListener("mouseup", checkClickEvent);
    browser.runtime.onMessage.addListener(listingBackgroundScript);

})();
