import { useEffect, useState } from "react";
import { fetchProfile, getStoredUser, changePassword } from "../services/authService";
import TopNav from "../components/nav/TopNav";
import PasswordInput from "../components/ui/PasswordInput";

const TABS_BY_ROLE = {
    resident: [
        { label: "Register", to: "/resident/register" },
        { label: "History", to: "/resident/history" },
    ],
    guard: [
        { label: "Scan", to: "/guard/scan" },
        { label: "Log", to: "/guard/log" },
    ],
    admin: [
        { label: "Overview", to: "/admin" },
        { label: "Residents", to: "/admin/residents" },
        { label: "Reports", to: "/admin/reports" },
        { label: "Settings", to: "/admin/settings" },
    ],
};

const fieldClass =
    "w-full bg-surface-alt border border-border text-text rounded-lg px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
const labelClass =
    "block mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted";

export default function Profile() {
    const storedUser = getStoredUser();
    const tabs = TABS_BY_ROLE[storedUser?.role] || [];

    const [profile, setProfile] = useState(storedUser);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        current_password: "",
        password: "",
        password_confirmation: "",
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchProfile();
                setProfile(data.user);
            } catch (err) {
                console.error("Failed to load profile:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");
        setSaving(true);

        try {
            const data = await changePassword(form);
            setMessage(data.message || "Password changed successfully.");
            setForm({ current_password: "", password: "", password_confirmation: "" });

        } catch (err) {
            console.error("Change password failed:", err);

            if (err.response?.status === 422 && err.response?.data?.errors) {
                const firstError = Object.values(err.response.data.errors)[0]?.[0];
                setError(firstError || "Please check your input.");
            } else {
                setError(err.response?.data?.message || "Unable to change password.");
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg">

            <TopNav tabs={tabs} />

            <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto p-5 lg:p-8">

                <h1 className="text-xl font-bold text-text mb-5">
                    Profile
                </h1>

                {loading ? (
                    <p className="text-text-muted text-sm">Loading profile...</p>
                ) : (
                    <div className="bg-surface border border-border rounded-2xl p-5 mb-5">
                        <div className="space-y-3 text-sm">
                            <ProfileRow label="Name" value={profile?.name} />
                            <ProfileRow label="Email" value={profile?.email} />
                            <ProfileRow label="Role" value={profile?.role} capitalize />
                            {profile?.role === "resident" && (
                                <ProfileRow label="Assigned Unit" value={profile?.unit || "Not assigned"} />
                            )}
                            <ProfileRow
                                label="Status"
                                value={profile?.status}
                                valueClass={profile?.status === "active" ? "text-success" : "text-danger"}
                                capitalize
                            />
                        </div>
                    </div>
                )}

                <div className="bg-surface border border-border rounded-2xl p-5">
                    <h2 className="text-sm font-bold text-text mb-4">
                        Change Password
                    </h2>

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

                    <form onSubmit={handleChangePassword} className="space-y-3.5">
                        <div>
                            <label className={labelClass}>Current Password</label>
                            <PasswordInput
                                value={form.current_password}
                                onChange={(e) => setForm({ ...form, current_password: e.target.value })}
                                className={fieldClass}
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClass}>New Password</label>
                            <PasswordInput
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className={fieldClass}
                                minLength={8}
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Confirm New Password</label>
                            <PasswordInput
                                value={form.password_confirmation}
                                onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                                className={fieldClass}
                                minLength={8}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Change Password"}
                        </button>
                    </form>
                </div>

            </div>

        </div>
    );
}

function ProfileRow({ label, value, valueClass = "text-text", capitalize = false }) {
    return (
        <div className="flex justify-between gap-4 border-b border-border pb-2.5 last:border-b-0 last:pb-0">
            <span className="text-text-muted">{label}</span>
            <span className={`font-medium ${valueClass} ${capitalize ? "capitalize" : ""}`}>
                {value || "-"}
            </span>
        </div>
    );
}
