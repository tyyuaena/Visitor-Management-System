import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerVisitor } from "../../services/visitorService";
import { getStoredUser } from "../../services/authService";
import TopNav from "../../components/nav/TopNav";

const TABS = [
    { label: "Register", to: "/resident/register" },
    { label: "History", to: "/resident/history" },
];

const fieldClass =
    "w-full bg-surface-alt border border-border text-text rounded-lg px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
const labelClass =
    "block mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted";

export default function RegisterVisitor() {
    const navigate = useNavigate();
    const unit = getStoredUser()?.unit;

    const [form, setForm] = useState({
        name: "",
        phone: "",
        purpose: "",
        expected_at: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await registerVisitor(form);
            navigate("/resident/history");

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
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                Phone
                            </label>
                            <input
                                type="text"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                className={fieldClass}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>
                            Purpose
                        </label>
                        <input
                            type="text"
                            name="purpose"
                            value={form.purpose}
                            onChange={handleChange}
                            className={fieldClass}
                            required
                        />
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
                        disabled={loading}
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
        </div>
    );
}
