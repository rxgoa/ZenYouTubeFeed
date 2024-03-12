(function () {
    function main() {        
        console.log("[LOGGER] ZEN_VIDEO_PAGE_SCRIPT LOADEAD");
        // this code should only be run when is detected that the user is on the youtube page. (youtube video player page).
        function customVideoPlayer() {
            // sets fixed position to the video player. Width(1270px) and Height(720px). 
            var flexy = document.querySelectorAll("ytd-watch-flexy[flexy]")[0];
            flexy.style.setProperty("--ytd-watch-flexy-non-player-height", "1");
            flexy.style.setProperty("--ytd-watch-flexy-non-player-width", "1");
            flexy.style.setProperty("--ytd-watch-flexy-min-player-width", "1");
            flexy.style.setProperty("--ytd-watch-flexy-max-player-height", "1");
            flexy.style.setProperty("--ytd-watch-flexy-max-player-width", "1");

            // sets the player fixed heigth and width
            var player = document.getElementById("player");
            player.style.setProperty("height", "720px");
            player.style.setProperty("width", "1270px");

            // CUSTOMIZATONS
            //
            // removes the subscribe button from the video page
            document.getElementById("subscribe-button").remove()


            // change border radius of video
            document.getElementById("ytd-player").style.setProperty("border-radius", "30px");

            // remove channel information
            document.getElementById("top-row").remove();
            document.getElementsByTagName("ytd-watch-metadata")[0].style.setProperty("margin-top", "30px");
            document.getElementsByTagName("ytd-watch-metadata")[0].style.setProperty("margin-bottom", "30px");
            document.getElementById("bottom-row").style.setProperty("margin-top", "30px");
            document.querySelector("h1.ytd-watch-metadata").style.setProperty("color", "#282828");
            document.querySelector("h1.ytd-watch-metadata").style.setProperty("font-weight", "bold");
            document.querySelector("h1.ytd-watch-metadata").style.setProperty("font-size", "2.4rem");

            // remove chapters, links merch for channel etc
            document.querySelectorAll(`[slot="extra-content"]`)[0].remove();

            // deletes sidebar of video player
            var secondary = document.querySelector("#secondary.style-scope.ytd-watch-flexy");
            secondary.remove();

            // sets content (video + comments) with fixed width
            var primary = document.querySelector("#primary.style-scope.ytd-watch-flexy");
            primary.style.setProperty("min-width", "1270px");
            primary.style.setProperty("max-width", "1270px");
            document.querySelector("#comments").style.setProperty("display", "none");
            // show more button clicked
            document.getElementById("expand").click();

            setTimeout(() => {                
                document.getElementById("actions").remove();
            }, 100);

        }

        // Callback function to execute when mutations are observed
        const callback = function (mutationsList, observer) {
            // Check if the specific element you're interested in is present
            if (document.querySelector('#comments') && window.getComputedStyle(document.querySelector('#comments')).display !== 'none') {
                customVideoPlayer();
                // Optionally, disconnect the observer if you no longer need to listen for changes
                observer.disconnect();
            }
        };

        // Create a MutationObserver instance
        const observer = new MutationObserver(callback);

        // Options for the observer (which mutations to observe)
        const config = { attributes: true, childList: true, subtree: true };

        // Target node to observe (for SPAs, observing 'body' or a higher-level container might be necessary)
        const targetNode = document.body;

        // Start observing the target node for configured mutations
        observer.observe(targetNode, config);
    }

    function checkExtension() {
        let extension = localStorage.getItem("zen-options");        
        if (extension) {
            var ext = JSON.parse(extension);
            if(ext.isEnable) {
                main();
            } else {
                return {};
            }
        }

        return {};
    }

    checkExtension();

})();