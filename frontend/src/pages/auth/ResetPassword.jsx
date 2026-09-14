import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../services/authService";
import PasswordInput from "../../components/ui/PasswordInput";
import PasswordRequirements from "../../components/ui/PasswordRequirements";

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email") || "";
    const token = searchParams.get("token") || "";

    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const confirmMismatch =
        passwordConfirmation.length > 0 && password !== passwordConfirmation;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!email || !token) {
            setError("This reset link is missing required information.");
            return;
        }

        setLoading(true);

        try {
            await resetPassword({
                email,
                token,
                password,
                password_confirmation: passwordConfirmation,
            });

            navigate("/login", {
                replace: true,
                state: { message: "Password reset successfully. Please log in." },
            });

        } catch (error) {
            console.error("Reset password failed:", error);

            if (error.response?.status === 422 && error.response?.data?.errors) {
                const firstError = Object.values(error.response.data.errors)[0]?.[0];
                setError(firstError || "Please check your input.");
            } else {
                setError(
                    error.response?.data?.message || "Unable to reset your password."
                );
            }
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
                        Set a new password
                    </p>
                </div>

                <div className="bg-surface border border-border rounded-2xl p-6">

                    {error && (
                        <div className="bg-danger-bg text-danger text-sm p-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    {!email || !token ? (
                        <p className="text-text-muted text-sm">
                            This reset link is invalid. Please request a new one from the{" "}
                            <Link to="/forgot-password" className="text-primary font-medium">
                                forgot password
                            </Link>{" "}
                            page.
                        </p>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                                    New Password
                                </label>
                                <PasswordInput
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-surface-alt border border-border text-text rounded-lg px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Enter a new password"
                                    minLength={8}
                                    required
                                />
                                {password && <PasswordRequirements value={password} />}
                            </div>

                            <div>
                                <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                                    Confirm Password
                                </label>
                                <PasswordInput
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    className="w-full bg-surface-alt border border-border text-text rounded-lg px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Re-enter the new password"
                                    minLength={8}
                                    required
                                />
                                {confirmMismatch && (
                                    <p className="mt-1.5 text-xs text-danger">
                                        Passwords do not match.
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || confirmMismatch}
                                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {loading ? "Saving..." : "Reset Password"}
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
