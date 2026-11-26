/** Shared by the root layout (server) and the toggle (client): keep it out of the "use client" module. */
export const MOTION_STORAGE_KEY = "revio-motion";

/** Runs in <head> before React: no flash of animation for someone who turned it off. */
export const MOTION_INIT_SCRIPT = `try{if(localStorage.getItem("${MOTION_STORAGE_KEY}")==="reduce")document.documentElement.dataset.motion="reduce"}catch(e){}`;
