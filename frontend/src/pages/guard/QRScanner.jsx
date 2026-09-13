import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { verifyQR } from "../../services/guardService";
import VisitorVerification from "./VisitorVerification";
import TopNav from "../../components/nav/TopNav";

import { GUARD_TABS as TABS } from "../../constants/navTabs";

export default function QRScanner() {

    const scannerRef = useRef(null);

    const [visitor, setVisitor] = useState(null);
    const [error, setError] = useState("");
    const [scanning, setScanning] = useState(true);
    const [cameraStarted, setCameraStarted] = useState(false);
    const [manualToken, setManualToken] = useState("");
    const [manualLoading, setManualLoading] = useState(false);

    // Handle QR value
    const handleQRCode = async (
        qrValue
    ) => {

        setError("");

        try {

            const response =
                await verifyQR(qrValue);

            if (response.valid) {

                setVisitor(
                    response.visitor
                );

                setScanning(false);

            } else {

                setError(
                    response.message ||
                    "Invalid QR code."
                );
            }

        } catch (err) {

            console.error(err);

            setError(
                err.response?.data?.message ||
                "QR verification failed."
            );

            setScanning(false);
        }
    };

    // Start camera — only once the guard explicitly opts in, rather than
    // requesting camera access the instant this page loads.
    useEffect(() => {

        if (!cameraStarted || !scanning || visitor) {
            return;
        }

        const scanner = new Html5Qrcode(
            "qr-reader"
        );

        scannerRef.current = scanner;

        // start() is async — in React StrictMode's dev-only double-invoke,
        // the cleanup below can otherwise run before start() has actually
        // attached a stream (isScanning still false), leaving the first
        // camera instance orphaned while a second one starts against the
        // same DOM node. Tracking the in-flight promise lets cleanup wait
        // for start() to settle before deciding whether to stop it.
        let startPromise;

        const startScanner = async () => {

            try {

                await scanner.start(
                    {
                        facingMode: "environment",
                    },

                    {
                        fps: 10,
                        qrbox: {
                            width: 250,
                            height: 250,
                        },
                    },

                    async (decodedText) => {

                        // Stop scanning immediately after obtaining a QR code
                        try {

                            await scanner.stop();

                        } catch (stopError) {

                            console.error(
                                "Scanner stop error:",
                                stopError
                            );

                        }

                        await handleQRCode(
                            decodedText
                        );
                    },

                    () => {}
                );

            } catch (cameraError) {

                console.error(
                    "Camera error:",
                    cameraError
                );

                setError(
                    "Unable to access the camera. Please allow camera permission or use manual QR entry."
                );

                setScanning(false);
                setCameraStarted(false);
            }
        };

        startPromise = startScanner();

        // Cleanup when leaving page — wait for the in-flight start() to
        // settle (success or failure) before attempting to stop, so we
        // never call stop() on a scanner that's still mid-initialization.
        return () => {

            startPromise
                .catch(() => {})
                .finally(() => {
                    if (
                        scannerRef.current &&
                        scannerRef.current.isScanning
                    ) {
                        scannerRef.current
                            .stop()
                            .catch(() => {});
                    }
                });

        };

    }, [cameraStarted, scanning, visitor]);

    // Manual QR token verification
    const handleManualVerification =
        async (e) => {

            e.preventDefault();

            if (!manualToken.trim()) {

                setError(
                    "Please enter the QR value."
                );

                return;
            }

            setManualLoading(true);
            setError("");

            try {

                const response =
                    await verifyQR(
                        manualToken.trim()
                    );

                if (response.valid) {

                    setVisitor(
                        response.visitor
                    );

                } else {

                    setError(
                        response.message ||
                        "Invalid QR code."
                    );
                }

            } catch (err) {

                console.error(err);

                setError(
                    err.response?.data?.message ||
                    "QR verification failed."
                );

            } finally {

                setManualLoading(false);
            }
        };

    // Reset scanner, resuming the camera immediately since the guard has
    // already opted into scanning mode once this session
    const handleScanAgain = () => {

        setVisitor(null);
        setError("");
        setManualToken("");
        setScanning(true);
        setCameraStarted(true);
    };

    // Stop the camera and return to the idle "Start Scanning" state
    const handleStopScanning = () => {

        setCameraStarted(false);
        setError("");
    };

    // If visitor is successfully verified, show verification card
    if (visitor) {

        return (
            <div className="min-h-screen bg-bg">

                <TopNav tabs={TABS} />

                <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto p-5 lg:p-8">

                    <VisitorVerification
                        visitor={visitor}
                    />

                    <button
                        onClick={handleScanAgain}
                        className="mt-4 w-full bg-surface-alt border border-border hover:bg-white/5 text-text py-3 rounded-lg text-sm font-semibold transition-colors"
                    >
                        Scan Another Visitor
                    </button>

                </div>

            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg">

            <TopNav tabs={TABS} />

            <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto p-5 lg:p-8">

                <div className="bg-surface border border-border rounded-2xl p-5">

                    <h1 className="text-lg font-bold text-text text-center">
                        Scan Visitor QR Code
                    </h1>

                    <p className="text-text-muted text-sm text-center mt-1.5 mb-5">
                        Ask the visitor to display their QR code.
                    </p>

                    {/* Error */}
                    {error && (

                        <div className="mb-4 p-3 bg-danger-bg text-danger text-sm rounded-lg">
                            {error}
                        </div>

                    )}

                    {/* Idle state: camera access only requested once the guard opts in */}
                    {!cameraStarted && (

                        <button
                            onClick={() => {
                                setError("");
                                setCameraStarted(true);
                            }}
                            className="w-full flex flex-col items-center justify-center gap-3 bg-surface-alt border border-border rounded-lg py-10 hover:bg-white/5 transition-colors"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-primary">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                <circle cx="12" cy="13" r="4" />
                            </svg>
                            <span className="text-primary font-semibold text-sm">
                                Start Scanning
                            </span>
                        </button>

                    )}

                    {/* QR scanner */}
                    {cameraStarted && scanning && (
                        <>
                            <div
                                id="qr-reader"
                                className="w-full rounded-lg overflow-hidden"
                            />

                            <button
                                onClick={handleStopScanning}
                                className="w-full mt-3 bg-surface-alt border border-border hover:bg-white/5 text-text py-2.5 rounded-lg text-sm font-semibold transition-colors"
                            >
                                Stop Scanning
                            </button>
                        </>
                    )}

                    {/* Manual input */}
                    <div className="mt-6 border-t border-border pt-5">

                        <h2 className="font-semibold text-text text-sm mb-1">
                            Manual QR Verification
                        </h2>

                        <p className="text-xs text-text-muted mb-3">
                            Use this if the camera is unavailable.
                        </p>

                        <form
                            onSubmit={
                                handleManualVerification
                            }
                        >

                            <input
                                type="text"
                                value={manualToken}
                                onChange={(e) =>
                                    setManualToken(
                                        e.target.value
                                    )
                                }
                                placeholder="Enter QR value"
                                className="w-full bg-surface-alt border border-border text-text rounded-lg px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />

                            <button
                                type="submit"
                                disabled={manualLoading}
                                className="w-full mt-3 bg-primary hover:bg-primary-dark text-white py-3 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
                            >
                                {manualLoading
                                    ? "Verifying..."
                                    : "Verify QR"}
                            </button>

                        </form>

                    </div>

                </div>

            </div>

        </div>
    );
}
