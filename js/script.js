let addItemForm = document.querySelector('#addItemForm');
let actionItem = document.querySelector('.actionItems');

let greetingName = document.querySelector('.greeting__name');

let actionItemsUtils = new ActionItems();

//chrome.storage.sync.clear();

//if any data, display data
chrome.storage.sync.get(['actionItems','name'],(data)=>{ 
  setGreeting();
  
  if(data.actionItems){
    //set name from storage
    setUsersName(data.name);
    //display items
    renderActionItems(data.actionItems);
    //display quick actions item
    createQuickActionListener();

    //name update dialog and process
    updateName();
    createUpdateNameListener();

    //progress bar
    actionItemsUtils.setProgress();
    //if anything is changed add/delete etc, update progress bar
    chrome.storage.onChanged.addListener(()=>{
      actionItemsUtils.setProgress();
    })
  }    
    console.log(data.actionItems);
});

//render all single items using above default
const renderActionItems = (actionItems) =>{
  //filter the completed items from yesterday and later
  const filteredItems = filterCompletedActions(actionItems);

  filteredItems.forEach((actionItem) =>{
    renderActionItem(actionItem.text,actionItem.id,actionItem.completed,actionItem.website);
  });

  //filter from storage as well
  chrome.storage.sync.set({
    actionItems:filteredItems
  })
}

//after enter is pressed
addItemForm.addEventListener('submit',(e)=>{
  e.preventDefault();
  let itemText = addItemForm.elements.namedItem('itemText').value;
  if(itemText){
    actionItemsUtils.add(itemText,null,(actionItem)=>{
      renderActionItem(actionItem.text,actionItem.id,actionItem.completed,actionItem.website,250);
    });
    
    addItemForm.elements.namedItem('itemText').value = '';
  }
})

//if quick action button is clicked
const handleQuickActionListener = (e) => {
  let text = e.target.getAttribute('data-text');
  let id = e.target.getAttribute('data-id')

  //if we use promise, current tab works:
  getCurrentTab().then((tab)=>{
    actionItemsUtils.addQuickActionItem(id,text,tab,(actionItem)=>{
      renderActionItem(actionItem.text,actionItem.id,actionItem.completed,actionItem.website,250);
    })
  })

}

//gets the current tab
const getCurrentTab = async () =>{
  return await new Promise((resolve,reject)=>{
    chrome.tabs.query({'active':true,'windowId':chrome.windows.WINDOW_ID_CURRENT},(tabs)=>{
      resolve(tabs[0]);
    })
  })
 
}

//add quick action item to action list
const createQuickActionListener = () =>{
  let buttons = document.querySelectorAll('.quick-action');
  buttons.forEach((button) =>{
    button.addEventListener('click',handleQuickActionListener);
  });
}

//adding event listener when check box is clicked,
const handleCompletedEventListener = (e) =>{
  //getting id of clicked li
  let id = e.target.parentElement.parentElement.getAttribute('data-id');
  let parent = e.target.parentElement.parentElement;
  
  //if li is marked
  if(parent.classList.contains('completed')){
    actionItemsUtils.markUnmarkCompleted(id,null);
    parent.classList.remove('completed');
  }else{
    actionItemsUtils.markUnmarkCompleted(id,new Date().toString());
    parent.classList.add('completed');
  }
}

const handleDeleteEventListener = (e) =>{
  //getting id of clicked element
  let id = e.target.parentElement.parentElement.getAttribute('data-id');

  let parent = e.target.parentElement.parentElement;
  //for animate up after deleting
  let jElement = $(`div[data-id="${id}"]`);

  //remove from chrome storage
  actionItemsUtils.remove(id);
  animateUp(jElement);
}

//useing animate function for animation after deleting
const animateUp = (element) => {
  let height = element.innerHeight();
  element.animate({
  opacity: '0',
  marginTop:`-${height}px`
  },250,()=>{
    element.remove();
  })
}

//display in document object model
const renderActionItem = (text,id,completed,website=null,animationDuration=500) =>{
//creating the inner html seperately
  let element = document.createElement('div');
  element.classList.add('actionItem__item');

  //it runs only after li is clicked and set to complete, so that completed is true and class is added to show completed items
  if(completed){
    element.classList.add('completed');
  }

  //setting id for individual li
  element.setAttribute('data-id',id)
  
  let mainElement = document.createElement('div');
  mainElement.classList.add('actionItem__main');

  let checkElement = document.createElement('div');
  checkElement.classList.add('actionItem__check');
  checkElement.innerHTML = 
    `
    <div class="actionItem__checkBox">      
        <i class="fas fa-check" aria-hidden="true"></i>
    </div> 
    `     
  //adding event listener when check box is clicked,
  checkElement.addEventListener('click',handleCompletedEventListener);


  let textElement = document.createElement('div');
  textElement.classList.add('actionItem__text');
  textElement.textContent = text;

  let deleteElement = document.createElement('div');
  deleteElement.classList.add('actionItem__delete');
  deleteElement.innerHTML = `<i class="fas fa-times" aria-hidden="true"></i>`

  //adding event listener when delete is clicked
  deleteElement.addEventListener('click',handleDeleteEventListener);

  //appending child to their parent
  mainElement.appendChild(checkElement);
  mainElement.appendChild(textElement);
  mainElement.appendChild(deleteElement);
  element.appendChild(mainElement); 
  
  if(website){
    if(!website.fav_icon){
      website.fav_icon = "https://img.icons8.com/ios-glyphs/30/000000/link--v1.png";
    }
    //link site
    let linkContainer = createLinkContainer(website.url,website.fav_icon,website.title);
    element.appendChild(linkContainer);
  }

  actionItem.prepend(element);

  //to animate down using jquery default function: jElement
  let jElement = $(`div[data-id="${id}"]`);
  animateDown(jElement,animationDuration);
}

const animateDown = (element,duration) => {
  let height = element.innerHeight();
  element.css({marginTop:`-${height}px`,opacity:0}).animate({
    opacity:1,
    marginTop:'12px',
  },duration)
}


const createLinkContainer = (url,favIcon,title) =>{
  let element = document.createElement('div');
  element.classList.add('actionItem__linkContainer');
  element.innerHTML = 
  `
    <a href="${url}" target="_blank">
      <div class="actionItem__link">
          <div class="actionItem__favIcon">
              <img src="${favIcon}" alt="">
          </div>
          <div class="actionItem__title">
              <span>${title}</span>
          </div>
      </div>
    </a>
  `
  return element;
}

const updateName = () =>{
  let greetingName = document.querySelector('.greeting__name');
  //when we click name
  greetingName.addEventListener('click',()=>{

    chrome.storage.sync.get(['name'],(data)=>{
      let name = data.name ? data.name: '';
      document.getElementById('inputName').value = name;
    })

    $('#updateModal').modal('show')
  })
  
}

const createUpdateNameListener = () =>{
  let saveChange = document.querySelector('#name-change');
  saveChange.addEventListener('click',handleUpdateName);
}

const handleUpdateName = (e) =>{
  let inputName = document.getElementById('inputName').value;
  if(inputName){
    //save user name
    actionItemsUtils.saveName(inputName,()=>{
      setUsersName(inputName);
      console.log(inputName);
    })
  }
}

const setUsersName = (name) =>{
  let newName = name ? name: 'Add Name';
  document.querySelector('.name__value').innerText = newName;
}

const setGreeting = () =>{
  var hour = new Date().getHours();
  let greeting = "Good ";

  if(hour>=5 && hour <=11){
    greeting += 'Morning';
    imgSrc = "images/good-morning.png";
  }else if(hour>=12 && hour <=16){
    greeting += 'Afternoon';
    imgSrc = "images/good-afternoon.png";
  }else if(hour>=17 && hour <=20){
    greeting += 'Evening';
    imgSrc = "images/good-evening.png";
  }else if(hour>=20 && hour <=5){
    greeting += 'Night';
    imgSrc = "images/good-night.png";
  }
  document.querySelector('.greeting__type').innerText = greeting;
  document.getElementById('greeting__image').setAttribute('src',imgSrc);
}

//display only completed items from today not from yesterday or later on
const filterCompletedActions = (actionItems) =>{
  var currentDate = new Date();
  currentDate.setHours(0,0,0,0);

  const filteredItems = actionItems.filter((item)=>{
    if(item.completed){
      const completedDate = new Date(item.completed);
      if(completedDate < currentDate){
        return false;
      }
    }
    return true;
  })
  return filteredItems;
}
