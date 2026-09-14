import { useCallback, useRef, useState } from "react";
import DialogContextInstance from "./dialog-context-instance";
import ConfirmDialog from "../components/ui/ConfirmDialog";

// Replaces window.confirm()/alert() with an app-styled modal. Both native
// dialogs are synchronous (block the whole page, browser-chrome look); a
// React modal can't block, so confirm()/alertUser() (see useDialog.js)
// return a Promise that resolves once the user clicks a button, letting
// call sites just add `await` in front of what used to be
// `window.confirm(...)`.
export function DialogProvider({ children }) {
    const [dialog, setDialog] = useState(null);
    const resolverRef = useRef(null);

    const openDialog = useCallback((message, options) => {
        return new Promise((resolve) => {
            resolverRef.current = resolve;
            setDialog({ message, ...options });
        });
    }, []);

    const confirm = useCallback(
        (message, options) => openDialog(message, { variant: "confirm", ...options }),
        [openDialog]
    );

    const alertUser = useCallback(
        (message, options) => openDialog(message, { variant: "alert", ...options }),
        [openDialog]
    );

    const resolve = (value) => {
        resolverRef.current?.(value);
        resolverRef.current = null;
        setDialog(null);
    };

    return (
        <DialogContextInstance.Provider value={{ confirm, alertUser }}>
            {children}

            {dialog && (
                <ConfirmDialog
                    {...dialog}
                    onConfirm={() => resolve(true)}
                    onCancel={() => resolve(false)}
                />
            )}
        </DialogContextInstance.Provider>
    );
}
