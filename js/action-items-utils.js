class ActionItems{

    addQuickActionItem = (id,text,tab,callback) =>{
      let website = null;
      if(id == 'quick-action-3'){
        website = {
          url:tab.url,
          fav_icon:tab.favIconUrl,
          title:tab.title
        }
      }        
      this.add(text,website,callback);
    }

    add = (text,website=null,callback) => {
        let actionItem = {
          id:uuidv4(),
          added:new Date().toString(),
          text: text,
          completed:null,
          website:website,
        }
        //saves data in chrome storage
        chrome.storage.sync.get(['actionItems'],(data)=>{
          let items = data.actionItems;
          if(!items){
            items = [actionItem];
          }else{
            items.push(actionItem);
          }
      
          chrome.storage.sync.set({
            actionItems:items  
          },()=>{
            callback(actionItem);
          })
        });
    }

    markUnmarkCompleted = (id,completeStatus) =>{
        //grab all the data
        chrome.storage.sync.get(['actionItems'],(data)=>{
          let items = data.actionItems;
          //get the index of data with id of clicked html li
          let foundIndexItem = items.findIndex((item) => item.id == id);
          
          if(foundIndexItem >= 0){
            items[foundIndexItem].completed = completeStatus;
            //set/save the data
            chrome.storage.sync.set({
              actionItems:items
            });
          }
        })
    }

    remove = (id) =>{
      chrome.storage.sync.get(['actionItems'],(data)=>{
        let items = data.actionItems;
        let removeItem = items.findIndex((item) => item.id == id);
        if(removeItem >= 0){
          items.splice(removeItem,1);
          
          chrome.storage.sync.set({
            actionItems:items
          });
    
        }
      })
    }

    //use call back, after saving  send the data back
    saveName = (name,callback) =>{
      chrome.storage.sync.set({
        name:name
      },callback);
    }

    setProgress = () =>{
      chrome.storage.sync.get(['actionItems'],(data)=>{
        let actionItems = data.actionItems;
        let completedActions;
        let totalActions = actionItems.length; 
        //null is false, date is true
        //return only if true
        completedActions = actionItems.filter(actionItem => actionItem.completed).length;
        
        let progress = 0;
        //otherwise total action may be 0 and if divided by 0, then infinite 
        if(totalActions>0){
          progress = completedActions/totalActions;
        }
        
        this.setBrowserBadge(totalActions-completedActions);
        //default code to display progress bar
        circle.animate(progress);
      })
    }

    //display the number of items in chrome extensions
    setBrowserBadge = (todoItems) =>{
      let text = `${todoItems}`;
      if(todoItems > 9){
        text='9+';
      }
      chrome.action.setBadgeText({text:text})
    }

}