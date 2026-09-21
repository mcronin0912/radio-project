const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("radioDesktop", {
  getFavourites: () => ipcRenderer.invoke("favourites:get"),
  setFavourites: (slugs) => ipcRenderer.invoke("favourites:set", slugs),
  getTvFavourites: () => ipcRenderer.invoke("tv-favourites:get"),
  setTvFavourites: (slugs) => ipcRenderer.invoke("tv-favourites:set", slugs),
  onEpgUpdated: (callback) => {
    const listener = () => {
      try {
        callback();
      } catch {
        /* ignore */
      }
    };
    ipcRenderer.on("epg:updated", listener);
    return () => {
      ipcRenderer.removeListener("epg:updated", listener);
    };
  },
});
