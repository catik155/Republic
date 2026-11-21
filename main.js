const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// Remove Electron's default File/Edit/View menu so the app feels like a game, not a dev shell.
Menu.setApplicationMenu(null);

function createWindow(){
  const win = new BrowserWindow({
    width:1440,
    height:900,
    minWidth:960,
    minHeight:640,
    backgroundColor:'#080d14',
    title:'Республика',
    autoHideMenuBar:true,
    webPreferences:{
      preload:path.join(__dirname,'preload.js'),
      contextIsolation:true,
      nodeIntegration:false
    }
  });
  win.removeMenu();
  win.setMenuBarVisibility(false);
  // Electron runs the Vite-bundled renderer so Three.js module paths are
  // resolved at build time instead of relying on file:// import maps.
  win.loadFile(path.join(__dirname,'dist-web','index.html'));
}
app.whenReady().then(()=>{
  createWindow();
  app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()});
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
