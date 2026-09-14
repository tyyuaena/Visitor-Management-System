import { createContext } from "react";

// Just the raw context object, in its own file with no component export —
// DialogContext.jsx (the provider) and useDialog.js (the hook) both import
// this. Keeping it separate is what lets each of those files export only
// one kind of thing, which Vite's Fast Refresh requires (a file mixing a
// component export with a non-component export breaks it).
const DialogContextInstance = createContext(null);

export default DialogContextInstance;
