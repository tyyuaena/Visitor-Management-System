import { useEffect, useState } from "react";

import { getSettings, updateSettings } from "../../services/adminService";
import TopNav from "../../components/nav/TopNav";

const TABS = [
    { label: "Overview", to: "/admin" },
    { label: "Residents", to: "/admin/residents" },
    { label: "Units", to: "/admin/units" },
    { label: "Reports", to: "/admin/reports" },
    { label: "Settings", to: "/admin/settings" },
];

const fieldClass =
    "w-full bg-surface-alt border border-border text-text rounded-lg px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
const labelClass =
    "block mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted";

function AdminSettings() {

    const [settings, setSettings] = useState({
        qr_expiry_hours: 24,
        visiting_start: "08:00",
        visiting_end: "22:00",
        max_advance_booking_days: 30,
        max_visitors_per_day: 10,
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {

        try {

            const data = await getSettings();
            setSettings(data.settings);

        } catch (error) {

            setError(
                error.response?.data?.message ||
                "Failed to load settings."
            );

        }
    };

    const saveSettings = async (e) => {

        e.preventDefault();

        setMessage("");
        setError("");

        try {

            await updateSettings(settings);

            setMessage(
                "System settings updated successfully."
            );

        } catch (error) {

            setError(
                error.response?.data?.message ||
                "Failed to save settings."
            );

        }
    };

    return (
        <div className="min-h-screen bg-bg">

            <TopNav tabs={TABS} />

            <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto p-5 lg:p-8">

                <h1 className="text-xl font-bold text-text mb-5">
                    Settings
                </h1>

                {message && (
                    <div className="bg-success-bg text-success text-sm p-3 rounded-lg mb-4">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="bg-danger-bg text-danger text-sm p-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                <form
                    onSubmit={saveSettings}
                    className="bg-surface border border-border rounded-2xl p-5 space-y-5"
                >

                    <div>
                        <h2 className="text-sm font-bold text-text mb-3">
                            QR Code Settings
                        </h2>

                        <label className={labelClass}>
                            QR Expiry Duration (hours)
                        </label>

                        <input
                            type="number"
                            min="1"
                            max="168"
                            value={settings.qr_expiry_hours}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    qr_expiry_hours: Number(e.target.value),
                                })
                            }
                            className={fieldClass}
                        />
                    </div>

                    <div>
                        <h2 className="text-sm font-bold text-text mb-3">
                            Visiting Hours
                        </h2>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Start</label>
                                <input
                                    type="time"
                                    value={settings.visiting_start}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            visiting_start: e.target.value,
                                        })
                                    }
                                    className={fieldClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>End</label>
                                <input
                                    type="time"
                                    value={settings.visiting_end}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            visiting_end: e.target.value,
                                        })
                                    }
                                    className={fieldClass}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-sm font-bold text-text mb-3">
                            Registration Rules
                        </h2>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>
                                    Max Advance Booking (days)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={settings.max_advance_booking_days}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            max_advance_booking_days: Number(e.target.value),
                                        })
                                    }
                                    className={fieldClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>
                                    Max Visitors / Day
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={settings.max_visitors_per_day}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            max_visitors_per_day: Number(e.target.value),
                                        })
                                    }
                                    className={fieldClass}
                                />
                            </div>
                        </div>

                        <p className="text-xs text-text-muted mt-2">
                            How far ahead residents may book a visit, and how many
                            visitors a resident may register for the same day.
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                        Save Settings
                    </button>

                </form>

            </div>

        </div>
    );
}

export default AdminSettings;
