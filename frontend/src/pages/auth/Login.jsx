import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
    login,
    dashboardPathForRole,
} from "../../services/authService";
import PasswordInput from "../../components/ui/PasswordInput";


export default function Login() {

    const navigate = useNavigate();
    const location = useLocation();

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const successMessage = location.state?.message;


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

            const data = await login(
                form.email,
                form.password
            );

            navigate(
                dashboardPathForRole(data.user?.role),
                { replace: true }
            );

        } catch (error) {

            console.error("Login failed:", error);

            setError(
                error.response?.data?.message ||
                "Unable to log in. Please check your credentials."
            );

        } finally {

            setLoading(false);

        }
    };


    return (

        <div className="min-h-screen bg-bg flex items-center justify-center p-6">

            <div className="w-full max-w-sm">

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-text tracking-tight">
                        VMS
                    </h1>
                    <p className="text-text-muted mt-1 text-sm">
                        Smart Visitor Management System
                    </p>
                </div>

                <div className="bg-surface border border-border rounded-2xl p-6">

                    {successMessage && (
                        <div className="bg-success-bg text-success text-sm p-3 rounded-lg mb-4">
                            {successMessage}
                        </div>
                    )}

                    {error && (
                        <div className="bg-danger-bg text-danger text-sm p-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-4"
                    >

                        <div>
                            <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                                Email
                            </label>

                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                className="w-full bg-surface-alt border border-border text-text rounded-lg px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>


                        <div>
                            <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                                Password
                            </label>

                            <PasswordInput
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                className="w-full bg-surface-alt border border-border text-text rounded-lg px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>


                        <div className="text-right -mt-1">
                            <Link
                                to="/forgot-password"
                                className="text-xs text-primary font-medium"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>

                    </form>

                </div>

                <p className="text-center text-text-muted text-sm mt-6">
                    Resident accounts are created by your administrator.
                </p>

            </div>

        </div>

    );
}
