import { useEffect, useState } from "react";

import { getUnits, createUnit, updateUnit, deleteUnit } from "../../services/adminService";
import { useDialog } from "../../context/useDialog";
import TopNav from "../../components/nav/TopNav";
import SubTabButton from "../../components/ui/SubTabButton";

import { ADMIN_TABS as TABS } from "../../constants/navTabs";

const fieldClass =
    "w-full bg-surface-alt border border-border text-text rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

const STATUS_CLASS = {
    active: "text-success",
    pending: "text-warning",
    inactive: "text-danger",
};

function AdminUnits() {
    const [subTab, setSubTab] = useState("manage");
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const fetchUnits = async () => {
        setLoading(true);
        setError("");

        try {
            const data = await getUnits();
            setUnits(data.units);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to load units.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchUnits();
    }, []);

    return (
        <div className="min-h-screen bg-bg">

            <TopNav tabs={TABS} />

            <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto p-5 lg:p-8">

                <h1 className="text-xl font-bold text-text mb-4">
                    Condominium Units
                </h1>

                <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                    <SubTabButton active={subTab === "manage"} onClick={() => setSubTab("manage")}>
                        Manage Units
                    </SubTabButton>
                    <SubTabButton active={subTab === "directory"} onClick={() => setSubTab("directory")}>
                        Directory
                    </SubTabButton>
                </div>

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

                {subTab === "manage" ? (
                    <ManageUnits
                        units={units}
                        loading={loading}
                        onChanged={fetchUnits}
                        setMessage={setMessage}
                        setError={setError}
                    />
                ) : (
                    <Directory units={units} loading={loading} />
                )}

            </div>

        </div>
    );
}

function ManageUnits({ units, loading, onChanged, setMessage, setError }) {
    const { confirm } = useDialog();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ code: "", label: "" });

    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ code: "", label: "" });

    const handleCreate = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        try {
            const data = await createUnit(form);
            setMessage(data.message || "Unit added.");
            setShowForm(false);
            setForm({ code: "", label: "" });
            onChanged();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to add unit.");
        }
    };

    const startEditing = (unit) => {
        setEditingId(editingId === unit.id ? null : unit.id);
        setEditForm({ code: unit.code, label: unit.label || "" });
    };

    const handleUpdate = async (e, id) => {
        e.preventDefault();
        setError("");
        setMessage("");

        try {
            await updateUnit(id, editForm);
            setEditingId(null);
            onChanged();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to update unit.");
        }
    };

    const handleDelete = async (id) => {
        if (!(await confirm("Remove this unit? This cannot be undone."))) {
            return;
        }

        setError("");
        setMessage("");

        try {
            await deleteUnit(id);
            onChanged();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to remove unit.");
        }
    };

    return (
        <>
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-3.5 py-2 rounded-lg transition-colors"
                >
                    + Add Unit
                </button>
            </div>

            {showForm && (
                <form
                    onSubmit={handleCreate}
                    className="bg-surface border border-border rounded-2xl p-4 mb-4 space-y-3"
                >
                    <h2 className="text-sm font-bold text-text">Add Unit</h2>

                    <input
                        type="text"
                        placeholder="Unit code (e.g. A-12-08)"
                        value={form.code}
                        onChange={(e) => setForm({ ...form, code: e.target.value })}
                        className={fieldClass}
                        required
                    />

                    <input
                        type="text"
                        placeholder="Label (optional)"
                        value={form.label}
                        onChange={(e) => setForm({ ...form, label: e.target.value })}
                        className={fieldClass}
                    />

                    <button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                    >
                        Add Unit
                    </button>
                </form>
            )}

            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-text-muted text-sm">Loading units...</div>
                ) : units.length === 0 ? (
                    <div className="p-8 text-center text-text-muted text-sm">No units yet.</div>
                ) : (
                    units.map((unit) => (
                        <div key={unit.id} className="border-b border-border last:border-b-0">
                            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                                <div className="min-w-0">
                                    <p className="font-semibold text-text text-sm truncate">
                                        {unit.code}
                                    </p>
                                    <p className="text-xs text-text-muted truncate">
                                        {unit.label || "No label"} · {unit.residents.length} resident{unit.residents.length === 1 ? "" : "s"}
                                    </p>
                                </div>

                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => startEditing(unit)}
                                        className="bg-surface-alt border border-border text-text text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        onClick={() => handleDelete(unit.id)}
                                        className="bg-danger-bg text-danger text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>

                            {editingId === unit.id && (
                                <form
                                    onSubmit={(e) => handleUpdate(e, unit.id)}
                                    className="px-4 pb-4 space-y-2.5"
                                >
                                    <input
                                        type="text"
                                        placeholder="Unit code"
                                        value={editForm.code}
                                        onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                                        className={fieldClass}
                                        required
                                    />

                                    <input
                                        type="text"
                                        placeholder="Label (optional)"
                                        value={editForm.label}
                                        onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                                        className={fieldClass}
                                    />

                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                                        >
                                            Save Changes
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setEditingId(null)}
                                            className="flex-1 bg-surface-alt border border-border text-text text-sm font-semibold py-2.5 rounded-lg hover:bg-white/5 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    ))
                )}
            </div>
        </>
    );
}

function Directory({ units, loading }) {
    const [expandedId, setExpandedId] = useState(null);

    return (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            {loading ? (
                <div className="p-8 text-center text-text-muted text-sm">Loading directory...</div>
            ) : units.length === 0 ? (
                <div className="p-8 text-center text-text-muted text-sm">No units yet.</div>
            ) : (
                units.map((unit) => (
                    <div key={unit.id} className="border-b border-border last:border-b-0">
                        <button
                            onClick={() => setExpandedId(expandedId === unit.id ? null : unit.id)}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-white/5 transition-colors"
                        >
                            <div className="min-w-0">
                                <p className="font-semibold text-text text-sm truncate">
                                    {unit.code}
                                    {unit.label ? ` · ${unit.label}` : ""}
                                </p>
                                <p className="text-xs text-text-muted truncate">
                                    {unit.residents.length === 0
                                        ? "Vacant"
                                        : unit.residents.map((r) => r.name).join(", ")}
                                </p>
                            </div>
                        </button>

                        {expandedId === unit.id && (
                            <div className="px-4 pb-4 space-y-2">
                                {unit.residents.length === 0 ? (
                                    <p className="text-xs text-text-muted">No residents assigned to this unit.</p>
                                ) : (
                                    unit.residents.map((resident) => (
                                        <div
                                            key={resident.id}
                                            className="bg-surface-alt border border-border rounded-lg px-3 py-2.5"
                                        >
                                            <p className="text-sm font-semibold text-text">{resident.name}</p>
                                            <p className="text-xs text-text-muted">{resident.email}</p>
                                            <p className={`text-xs mt-0.5 capitalize ${STATUS_CLASS[resident.status] || "text-text-muted"}`}>
                                                {resident.status}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}

export default AdminUnits;
