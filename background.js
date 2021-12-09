chrome.runtime.onInstalled.addListener((details)=>{
    if(details.reason == 'install'){
        console.log('On installed');
        chrome.storage.sync.set({
            actionItems:[]
        })
    }
})