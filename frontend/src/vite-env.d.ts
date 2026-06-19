/// <reference types="vite/client" />

// View Transitions API — not yet in default TS lib
interface Document {
  startViewTransition?: (callback: () => void | Promise<void>) => {
    ready: Promise<void>;
    finished: Promise<void>;
    updateCallbackDone: Promise<void>;
  };
}
