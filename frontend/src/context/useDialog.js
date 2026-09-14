import { useContext } from "react";
import DialogContextInstance from "./dialog-context-instance";

export function useDialog() {
    const ctx = useContext(DialogContextInstance);

    if (!ctx) {
        throw new Error("useDialog must be used within a DialogProvider");
    }

    return ctx;
}
