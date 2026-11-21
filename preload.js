const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('republicDesktop',{isDesktop:true,version:'0.15.0'});
