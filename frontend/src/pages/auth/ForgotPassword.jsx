import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../services/authService";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        try {
            const data = await forgotPassword(email);
            setMessage(data.message || "If an account with that email exists, a reset link has been sent.");
        } catch (error) {
            console.error("Forgot password failed:", error);
            setError(
                error.response?.data?.message || "Unable to process your request."
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
                        Reset your password
                    </p>
                </div>

                <div className="bg-surface border border-border rounded-2xl p-6">

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

                    {!message && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                                    Email
                                </label>

                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-surface-alt border border-border text-text rounded-lg px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {loading ? "Sending..." : "Send Reset Link"}
                            </button>
                        </form>
                    )}

                </div>

                <p className="text-center text-text-muted text-sm mt-6">
                    <Link to="/login" className="text-primary font-medium">
                        Back to Sign In
                    </Link>
                </p>

            </div>

        </div>
    );
}
