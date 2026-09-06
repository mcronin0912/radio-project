const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("radioDesktop", {
  getFavourites: () => ipcRenderer.invoke("favourites:get"),
  setFavourites: (slugs) => ipcRenderer.invoke("favourites:set", slugs),
});
