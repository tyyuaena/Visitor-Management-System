import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getVisitor, updateVisitor } from "../../services/visitorService";
import TopNav from "../../components/nav/TopNav";

import { RESIDENT_TABS as TABS } from "../../constants/navTabs";

const fieldClass =
    "w-full bg-surface-alt border border-border text-text rounded-lg px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
const labelClass =
    "block mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted";

export default function EditVisitor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: "",
        phone: "",
        purpose: "",
        expected_at: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Load visitor information
    useEffect(() => {
        const loadVisitor = async () => {
            try {
                const data = await getVisitor(id);
                const visitor = data.visitor;

                // Convert Laravel datetime into datetime-local format
                let expectedAt = "";
                if (visitor.expected_at) {
                    const date = new Date(visitor.expected_at);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    const hours = String(date.getHours()).padStart(2, "0");
                    const minutes = String(date.getMinutes()).padStart(2, "0");
                    expectedAt = `${year}-${month}-${day}T${hours}:${minutes}`;
                }

                setForm({
                    name: visitor.name || "",
                    phone: visitor.phone || "",
                    purpose: visitor.purpose || "",
                    expected_at: expectedAt,
                });

            } catch (error) {
                console.error("Failed to load visitor:", error);

                setError(
                    error.response?.data?.message ||
                    "Unable to load visitor."
                );

            } finally { setLoading(false); }
        };

        loadVisitor();

    }, [id]);

    const handleChange = (event) => {
        setForm({
            ...form,
            [event.target.name]: event.target.value,
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSaving(true);

        try {
            await updateVisitor(id, form);
            navigate("/resident/history");

        } catch (error) {
            console.error("Failed to update visitor:", error);

            if (
                error.response?.status === 422 && error.response?.data?.errors
            ) {
                const validationErrors = error.response.data.errors;
                const firstError = Object.values(validationErrors)[0]?.[0];
                setError(firstError || "Please check your input.");

            } else {
                setError(
                    error.response?.data?.message ||
                    "Unable to update visitor."
                );
            }

        } finally { setSaving(false); }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bg">
                <TopNav tabs={TABS} />
                <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto p-5 lg:p-8">
                    <p className="text-text-muted text-sm">
                        Loading visitor information...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg">

            <TopNav tabs={TABS} />

            <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto p-5 lg:p-8">

                <h1 className="text-xl font-bold text-text mb-5">
                    Edit Visitor
                </h1>

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
                            <label className={labelClass}>Name</label>
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
                            <label className={labelClass}>Phone</label>
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
                        <label className={labelClass}>Purpose</label>
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
                        <label className={labelClass}>Date & Time</label>
                        <input
                            type="datetime-local"
                            name="expected_at"
                            value={form.expected_at}
                            onChange={handleChange}
                            className={fieldClass}
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/resident/history")}
                            className="flex-1 bg-surface-alt border border-border text-text font-semibold py-3 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
