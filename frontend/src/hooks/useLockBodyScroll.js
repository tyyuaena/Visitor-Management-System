import { useEffect } from "react";

// Module-level (not per-component) state: several overlays can be locked at
// once — e.g. QRModal's auto-share opens the "sharing not supported" alert
// on top of itself. A naive save-on-mount/restore-on-unmount approach
// breaks in that case (each lock stomps on the value the other captured);
// a shared counter that only actually touches the DOM on the 0->1 and
// 1->0 transitions is immune to any mount/unmount order between them.
let lockCount = 0;
let originalOverflow = "";

export default function useLockBodyScroll() {
    useEffect(() => {
        if (lockCount === 0) {
            originalOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";
        }
        lockCount += 1;

        return () => {
            lockCount -= 1;
            if (lockCount === 0) {
                document.body.style.overflow = originalOverflow;
            }
        };
    }, []);
}
