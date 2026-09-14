import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerVisitor } from "../../services/visitorService";
import { getStoredUser } from "../../services/authService";
import TopNav from "../../components/nav/TopNav";
import QRModal from "../../components/resident/QRModal";

import { RESIDENT_TABS as TABS } from "../../constants/navTabs";

const fieldClass =
    "w-full bg-surface-alt border border-border text-text rounded-lg px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
const labelClass =
    "block mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted";

// Matches the backend's own validation exactly (VisitorController@store:
// 'regex:/^[0-9+\-\s()]+$/') so an invalid number is caught here instead of
// only after a round trip to the server.
const PHONE_PATTERN = /^[0-9+\-\s()]+$/;

const PURPOSE_OPTIONS = [
    "Guest Visit",
    "Delivery",
    "Food Delivery",
    "Service Provider",
    "Maintenance / Repair",
    "Ride-Hailing Pickup/Drop-off",
    "Moving In/Out",
    "Other",
];

export default function RegisterVisitor() {
    const navigate = useNavigate();
    const unit = getStoredUser()?.unit;

    const [form, setForm] = useState({
        name: "",
        phone: "",
        purpose: "",
        purposeOther: "",
        expected_at: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [registeredVisitor, setRegisteredVisitor] = useState(null);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    // Live, as-you-type check instead of only surfacing an invalid number
    // after the server rejects it.
    const phoneInvalid = form.phone.length > 0 && !PHONE_PATTERN.test(form.phone);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (phoneInvalid) {
            setError("Please enter a valid phone number.");
            return;
        }

        const purpose =
            form.purpose === "Other" ? form.purposeOther.trim() : form.purpose;

        if (form.purpose === "Other" && !purpose) {
            setError("Please specify the purpose of visit.");
            return;
        }

        setLoading(true);
        try {
            const data = await registerVisitor({
                name: form.name,
                phone: form.phone,
                purpose,
                expected_at: form.expected_at,
            });

            // Show the generated QR immediately (with the share sheet
            // following automatically — see QRModal's autoShare) instead of
            // sending the resident straight to the history list, where
            // they'd have to find the visitor again and tap "View QR".
            setRegisteredVisitor(data.visitor);

        } catch (error) {
            console.error(error);

            if (error.response?.status === 422 && error.response?.data?.errors) {
                const firstError = Object.values(error.response.data.errors)[0]?.[0];
                setError(firstError || "Please check your input.");
            } else {
                setError(
                    error.response?.data?.message || "Unable to register visitor."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg">

            <TopNav tabs={TABS} />

            <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto p-5 lg:p-8">

                <h1 className="text-xl font-bold text-text mb-1">
                    Register Visitor
                </h1>

                <p className="text-xs text-text-muted mb-5">
                    Visiting Unit {unit || "-"}
                </p>

                {error && (
                    <div className="bg-danger-bg text-danger text-sm p-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>
                                Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                className={fieldClass}
                                placeholder="e.g. John Tan"
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                Phone
                            </label>
                            <input
                                type="tel"
                                inputMode="tel"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                className={fieldClass}
                                placeholder="e.g. 012-345 6789"
                                required
                            />
                            {phoneInvalid && (
                                <p className="mt-1.5 text-xs text-danger">
                                    Only numbers, spaces, and + - ( ) are allowed.
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>
                            Purpose
                        </label>
                        <select
                            name="purpose"
                            value={form.purpose}
                            onChange={handleChange}
                            className={fieldClass}
                            required
                        >
                            <option value="" disabled>Select a purpose...</option>
                            {PURPOSE_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>

                        {form.purpose === "Other" && (
                            <input
                                type="text"
                                name="purposeOther"
                                value={form.purposeOther}
                                onChange={handleChange}
                                className={`${fieldClass} mt-2`}
                                placeholder="Please specify..."
                                required
                            />
                        )}
                    </div>

                    <div>
                        <label className={labelClass}>
                            Date & Time
                        </label>
                        <input
                            type="datetime-local"
                            name="expected_at"
                            value={form.expected_at}
                            onChange={handleChange}
                            className={fieldClass}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || phoneInvalid}
                        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold py-3.5 rounded-lg transition-colors disabled:opacity-50 mt-2"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <rect x="3" y="3" width="7" height="7" rx="1" />
                            <rect x="14" y="3" width="7" height="7" rx="1" />
                            <rect x="3" y="14" width="7" height="7" rx="1" />
                            <line x1="14" y1="14" x2="14" y2="21" />
                            <line x1="21" y1="14" x2="21" y2="21" />
                            <line x1="14" y1="17.5" x2="21" y2="17.5" />
                        </svg>
                        {loading ? "Generating..." : "Generate QR Code"}
                    </button>
                </form>
            </div>

            {registeredVisitor && (
                <QRModal
                    visitor={registeredVisitor}
                    autoShare
                    onClose={() => navigate("/resident/history")}
                />
            )}
        </div>
    );
}
