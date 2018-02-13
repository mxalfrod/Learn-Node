import axios from 'axios';
import dompurify from 'dompurify';

function searchResultsHMTL(stores){
    return stores.map(store=>{
        return `
        <a href="/store/${store.slug}" class="search__result">
        <strong>${store.name}</strong>
        </a>
        `;
        }).join('');
}

function typeAhead(search){
    let maxIndex;
    let currentIndex;
    let firstArrow;
    if(!search){
        return;
    }
    const searchInput = search.querySelector('input[name="search"]');
    const searchResults = search.querySelector('.search__results');
    console.log(searchInput,searchResults);
    searchInput.on('input', function(){
        // if there is no value
        if(!this.value){
            searchResults.style.display ='none';
            return;//stop
        }

        //show search results
        searchResults.style.display = 'block';
        currentIndex=0;
        firstArrow = false;
        axios
            .get("/api/search?q=" + this.value)
            .then(res => {
                if(res.data.length){
                    searchResults.innerHTML = dompurify.sanitize(searchResultsHMTL(res.data));
                    maxIndex =res.data.length-1;
                    currentIndex = 0;
                    firstArrow=true;
                    return
                }
                searchResults.innerHTML = dompurify.sanitize(`<div class="search__result"> No results for ${this.value} found!</div>`);
            })
            .catch(err=>{console.log(err)});

    });

    //handle keyboard inputs
    searchInput.on('keyup',(e)=>{

        if(![38,40,13].includes(e.keyCode)){
            return;//skip

        }

        let next=currentIndex;
        switch (e.keyCode){
            case 38:
                if (firstArrow){
                    next = maxIndex;
                    firstArrow = false;
                }else{
                    next = currentIndex === 0?maxIndex:currentIndex - 1;
                }
                break;
            case 40:
                if (!firstArrow){
                    next = currentIndex === maxIndex?0:currentIndex + 1;
                }else{
                    firstArrow = false;
                }
                break;
            case 13:
                //searchResults.children[currentIndex].click();
                window.location = searchResults.children[currentIndex].href;
                break;

        }

            searchResults.children[currentIndex].classList.remove("search__result--active");
            searchResults.children[next].classList.add("search__result--active");
            currentIndex = next;
    });

}

export default typeAhead;