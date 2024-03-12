function listenForClicks() {

    document.addEventListener("click", (e) => {
        
        function zen(tabs) {
            console.log(`sending message from zen.js ${Date.now()}`);
             browser.tabs.sendMessage(tabs[0].id, {
                type: "EXTENSION_OPTION_CHANGED"
             });

        }

        function showHomeScreen() {
                let homeScreen = document.getElementById("homeScreen");
                homeScreen.style.visibility = "visible";
                
                let categoriesScreen = document.getElementById("categoriesScreen");
                categoriesScreen.style.visibility = "hidden";                  
                let categoriesScreenList = document.getElementById("categoriesList");
                categoriesScreenList.innerHTML = "";

                let addCategoriesScreen = document.getElementById("addCategoryScreen");
                addCategoriesScreen.style.visibility = "hidden";
                let inputCategory = document.getElementById("categoryInput");
                inputCategory.value = "";
        }
  
        function showCategories(tabs) {
                // send message to            
                browser.tabs.sendMessage(tabs[0].id, { type: "OPTIONS_STORAGE_REQUESTED"})
                    .then((response) => {
                        console.log(response);
                        let categoriesDOM = document.getElementById("categoriesList");
                        if(response.categories && response.categories.length > 0){
                            response.categories.forEach((category) => {
                                let newItem = document.createElement("li");
                                newItem.textContent = category.name;
                                categoriesDOM.appendChild(newItem);
                            });
                        }

                        setCategoriesListVisibility("hidden", "visible");

                    });
        }

        function setCategoriesListVisibility(home, categories) {
                let homeScreen = document.getElementById("homeScreen"); 
                homeScreen.style.visibility = home;
                
                let categoriesScreen = document.getElementById("categoriesScreen");
                categoriesScreen.style.visibility = categories;       
        }

        function addCategory(tabs){
                let homeScreen = document.getElementById("homeScreen");
                homeScreen.style.visibility = "hidden";
                
                let addCategoriesScreen = document.getElementById("addCategoryScreen");
                addCategoriesScreen.style.visibility = "visible";       
        }

        function saveNewCategory(tabs){
                 let inputValue = document.getElementById("categoryInput");
                 browser.tabs
                    .sendMessage(tabs[0].id, { type: "OPTIONS_STORAGE_CATEGORIES_UPDATED", data: { name: inputValue.value } })
                    .then(() => {
                        showHomeScreen();
                    });
        }
        
        function backToHome() {
            showHomeScreen();
        }

        if(e.target.textContent.toUpperCase() === "ZEN"){
            browser.tabs
                .query({ active: true, currentWindow: true })
                .then(zen)
                .catch((error) => console.error(error));
        }

        if(e.target.name.toUpperCase() === "SHOW_CATEGORIES") {
            browser.tabs
                .query({ active: true, currentWindow: true })
                .then(showCategories)
                .catch((error) => console.log(error));
        }

        if(e.target.name.toUpperCase() === "ADD_CATEGORY") {
            browser.tabs
                .query({ active: true, currentWindow: true })
                .then(addCategory)
                .catch((error) => console.error(error));
        }

        if(e.target.name.toUpperCase() === "CREATE") {
            browser.tabs
                .query({ active: true, currentWindow: true })
                .then(saveNewCategory)
                .catch((error) => console.log(error));
        }

        if(e.target.name.toUpperCase() === "BACK") {
            backToHome();
        }

    });
}

function reportError(error) {
    console.log(error);
}

browser.tabs
    .executeScript({ file: '/content_scripts/zen_youtube_feed.js'})
    .then(listenForClicks)
    .catch(reportError);
