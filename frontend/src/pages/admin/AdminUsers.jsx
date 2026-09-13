import { useEffect, useState } from "react";

import {
    getUsers,
    createUser,
    updateUser,
    deactivateUser,
    resendActivation,
    resetUserPassword,
    getUnits,
} from "../../services/adminService";
import { getStoredUser } from "../../services/authService";
import TopNav from "../../components/nav/TopNav";
import PasswordInput from "../../components/ui/PasswordInput";

import { ADMIN_TABS as TABS } from "../../constants/navTabs";

const fieldClass =
    "w-full bg-surface-alt border border-border text-text rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

const STATUS_CLASS = {
    active: "text-success",
    pending: "text-warning",
    inactive: "text-danger",
};

function AdminUsers() {

    const currentUser = getStoredUser();

    const [users, setUsers] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [search, setSearch] = useState("");
    const [role, setRole] = useState("");
    const [status, setStatus] = useState("");
    const [unitFilter, setUnitFilter] = useState("");

    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        unit: "",
        role: "resident",
    });

    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({
        name: "",
        email: "",
        unit: "",
        status: "active",
    });

    useEffect(() => {
        fetchUsers();
        getUnits()
            .then((data) => setUnits(data.units))
            .catch((err) => console.error(err));
    }, []);

    const fetchUsers = async () => {

        setLoading(true);
        setError("");

        try {

            const data = await getUsers({
                search: search || undefined,
                role: role || undefined,
                status: status || undefined,
                unit: unitFilter || undefined,
            });

            setUsers(data.users);

        } catch (err) {

            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to load users."
            );

        } finally {

            setLoading(false);
        }
    };

    const handleCreate = async (e) => {

        e.preventDefault();
        setError("");
        setMessage("");

        try {

            let payload;
            if (form.role === "resident") {
                payload = { name: form.name, email: form.email, unit: form.unit, role: "resident" };
            } else if (form.role === "admin") {
                payload = { name: form.name, email: form.email, role: "admin" };
            } else {
                payload = { name: form.name, email: form.email, password: form.password, role: "guard" };
            }

            const data = await createUser(payload);

            setMessage(data.message || "Account created.");
            setShowForm(false);

            setForm({
                name: "",
                email: "",
                password: "",
                unit: "",
                role: "resident",
            });

            fetchUsers();

        } catch (err) {

            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to create user."
            );
        }
    };

    const handleDeactivate = async (id) => {

        if (
            !window.confirm(
                "Are you sure you want to deactivate this account?"
            )
        ) {
            return;
        }

        try {

            await deactivateUser(id);
            fetchUsers();

        } catch (err) {

            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to deactivate account."
            );
        }
    };

    const handleResendActivation = async (id) => {

        setError("");
        setMessage("");

        try {

            const data = await resendActivation(id);
            setMessage(data.message || "Activation email resent.");

        } catch (err) {

            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to resend activation email."
            );
        }
    };

    const handleResetPassword = async (id) => {

        if (
            !window.confirm(
                "Send this account a password reset email?"
            )
        ) {
            return;
        }

        setError("");
        setMessage("");

        try {

            const data = await resetUserPassword(id);
            setMessage(data.message || "Password reset email sent.");

        } catch (err) {

            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to send password reset email."
            );
        }
    };

    const startEditing = (user) => {

        setEditingId(editingId === user.id ? null : user.id);

        setEditForm({
            name: user.name,
            email: user.email,
            unit: user.unit || "",
            status: user.status === "pending" ? "active" : user.status,
        });
    };

    const handleUpdate = async (e, id) => {

        e.preventDefault();

        try {

            await updateUser(id, editForm);
            setEditingId(null);
            fetchUsers();

        } catch (err) {

            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to update user."
            );
        }
    };

    return (
        <div className="min-h-screen bg-bg">

            <TopNav tabs={TABS} />

            <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto p-5 lg:p-8">

                <div className="flex justify-between items-center mb-4">

                    <h1 className="text-xl font-bold text-text">
                        Accounts
                    </h1>

                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-3.5 py-2 rounded-lg transition-colors"
                    >
                        + Create
                    </button>

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

                {showForm && (

                    <form
                        onSubmit={handleCreate}
                        className="bg-surface border border-border rounded-2xl p-4 mb-4 space-y-3"
                    >

                        <h2 className="text-sm font-bold text-text">
                            Create Account
                        </h2>

                        <select
                            value={form.role}
                            onChange={(e) =>
                                setForm({ ...form, role: e.target.value })
                            }
                            className={fieldClass}
                        >
                            <option value="resident">Resident</option>
                            <option value="guard">Security Guard</option>
                            <option value="admin">Administrator</option>
                        </select>

                        <input
                            type="text"
                            placeholder="Name"
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            className={fieldClass}
                            required
                        />

                        <input
                            type="email"
                            placeholder="Email"
                            value={form.email}
                            onChange={(e) =>
                                setForm({ ...form, email: e.target.value })
                            }
                            className={fieldClass}
                            required
                        />

                        {form.role === "resident" && (
                            <select
                                value={form.unit}
                                onChange={(e) =>
                                    setForm({ ...form, unit: e.target.value })
                                }
                                className={fieldClass}
                                required
                            >
                                <option value="">Select unit...</option>
                                {units.map((u) => (
                                    <option key={u.id} value={u.code}>
                                        {u.code}{u.label ? ` · ${u.label}` : ""}
                                    </option>
                                ))}
                            </select>
                        )}

                        {form.role === "guard" ? (
                            <PasswordInput
                                placeholder="Password"
                                value={form.password}
                                onChange={(e) =>
                                    setForm({ ...form, password: e.target.value })
                                }
                                className={fieldClass}
                                required
                            />
                        ) : (
                            <p className="text-xs text-text-muted">
                                No password needed — the account will receive an
                                activation email to set its own password.
                            </p>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                        >
                            Create Account
                        </button>

                    </form>
                )}

                <div className="space-y-2 mb-4">
                    <input
                        type="text"
                        placeholder="Search name/email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={fieldClass}
                    />

                    <input
                        type="text"
                        placeholder="Filter by unit..."
                        value={unitFilter}
                        onChange={(e) => setUnitFilter(e.target.value)}
                        className={fieldClass}
                    />

                    <div className="flex gap-2">
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className={`${fieldClass} flex-1`}
                        >
                            <option value="">All Roles</option>
                            <option value="resident">Resident</option>
                            <option value="guard">Guard</option>
                            <option value="admin">Administrator</option>
                        </select>

                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className={`${fieldClass} flex-1`}
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="inactive">Inactive</option>
                        </select>

                        <button
                            onClick={fetchUsers}
                            className="shrink-0 bg-surface-alt border border-border text-text text-sm font-semibold px-3.5 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            Go
                        </button>
                    </div>
                </div>

                <div className="bg-surface border border-border rounded-2xl overflow-hidden">

                    {loading ? (

                        <div className="p-8 text-center text-text-muted text-sm">
                            Loading users...
                        </div>

                    ) : users.length === 0 ? (

                        <div className="p-8 text-center text-text-muted text-sm">
                            No users found.
                        </div>

                    ) : (

                        users.map((user) => {
                            const isSelf = user.id === currentUser?.id;

                            return (
                            <div key={user.id} className="border-b border-border last:border-b-0">

                                <div className="flex items-center justify-between gap-3 px-4 py-3.5">

                                    <div className="min-w-0">
                                        <p className="font-semibold text-text text-sm truncate">
                                            {user.name}
                                            {isSelf && (
                                                <span className="text-text-muted font-normal"> (you)</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-text-muted truncate">
                                            {user.email}
                                        </p>
                                        <p className="text-xs text-text-muted mt-0.5 capitalize">
                                            {user.role}
                                            {user.role === "resident" && user.unit ? ` · Unit ${user.unit}` : ""}
                                            {" · "}
                                            <span className={STATUS_CLASS[user.status] || "text-text-muted"}>
                                                {user.status}
                                            </span>
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-1.5 shrink-0 items-end">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => startEditing(user)}
                                                className="bg-surface-alt border border-border text-text text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                                            >
                                                Edit
                                            </button>

                                            {user.status === "active" && !isSelf && (
                                                <button
                                                    onClick={() => handleDeactivate(user.id)}
                                                    className="bg-danger-bg text-danger text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    Deactivate
                                                </button>
                                            )}
                                        </div>

                                        {user.status === "active" && (
                                            <button
                                                onClick={() => handleResetPassword(user.id)}
                                                className="bg-primary/15 text-primary text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                Reset Password
                                            </button>
                                        )}

                                        {user.status === "pending" && (
                                            <button
                                                onClick={() => handleResendActivation(user.id)}
                                                className="bg-warning-bg text-warning text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                Resend Activation
                                            </button>
                                        )}
                                    </div>

                                </div>

                                {editingId === user.id && (
                                    <form
                                        onSubmit={(e) => handleUpdate(e, user.id)}
                                        className="px-4 pb-4 space-y-2.5"
                                    >
                                        <input
                                            type="text"
                                            placeholder="Name"
                                            value={editForm.name}
                                            onChange={(e) =>
                                                setEditForm({ ...editForm, name: e.target.value })
                                            }
                                            className={fieldClass}
                                            required
                                        />

                                        <input
                                            type="email"
                                            placeholder="Email"
                                            value={editForm.email}
                                            onChange={(e) =>
                                                setEditForm({ ...editForm, email: e.target.value })
                                            }
                                            className={fieldClass}
                                            required
                                        />

                                        {user.role === "resident" && (
                                            <select
                                                value={editForm.unit}
                                                onChange={(e) =>
                                                    setEditForm({ ...editForm, unit: e.target.value })
                                                }
                                                className={fieldClass}
                                                required
                                            >
                                                <option value="">Select unit...</option>
                                                {units.map((u) => (
                                                    <option key={u.id} value={u.code}>
                                                        {u.code}{u.label ? ` · ${u.label}` : ""}
                                                    </option>
                                                ))}
                                            </select>
                                        )}

                                        <select
                                            value={editForm.status}
                                            onChange={(e) =>
                                                setEditForm({ ...editForm, status: e.target.value })
                                            }
                                            disabled={isSelf}
                                            className={`${fieldClass} disabled:opacity-50`}
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>

                                        {isSelf && (
                                            <p className="text-xs text-text-muted">
                                                You cannot deactivate your own account.
                                            </p>
                                        )}

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
                            );
                        })

                    )}

                </div>

            </div>

        </div>
    );
}

export default AdminUsers;
