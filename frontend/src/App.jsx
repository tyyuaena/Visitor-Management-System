import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import { DialogProvider } from "./context/DialogContext";
import { getStoredUser, dashboardPathForRole } from "./services/authService";

// Login is kept as a static import — it's the page nearly every visitor
// hits first, so it belongs in the initial bundle. Everything else here is
// role-gated (a resident never needs the admin bundle, etc.), so it's
// lazy-loaded instead: without this, every visitor downloaded all pages for
// all roles up front — including html5-qrcode (guard's QR scanner), which
// alone was the bulk of a 744KB single-chunk bundle.
import Login from "./pages/auth/Login";

const ActivateAccount = lazy(() => import("./pages/auth/ActivateAccount"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));

const Profile = lazy(() => import("./pages/Profile"));

const RegisterVisitor = lazy(() => import("./pages/resident/RegisterVisitor"));
const ResidentHistory = lazy(() => import("./pages/resident/ResidentHistory"));
const EditVisitor = lazy(() => import("./pages/resident/EditVisitor"));

const QRScanner = lazy(() => import("./pages/guard/QRScanner"));
const GuardLog = lazy(() => import("./pages/guard/GuardLog"));

const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminUnits = lazy(() => import("./pages/admin/AdminUnits"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));


// Sends a visitor to login (if signed out) or their own dashboard (if signed in)
function RootRedirect() {
    const user = getStoredUser();
    const token = localStorage.getItem("token");

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <Navigate
            to={dashboardPathForRole(user.role)}
            replace
        />
    );
}


// Matches the "Loading..." text pattern already used by every page's own
// data-fetching state — shown briefly while a lazy-loaded page's own chunk
// downloads, so switching pages never just goes blank on a slow connection.
function RouteFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-text-muted text-sm">Loading...</p>
        </div>
    );
}


function App() {
    return (
        <DialogProvider>
        <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
            <Routes>

                {/* Default Route */}
                <Route path="/" element={<RootRedirect />} />

                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/activate" element={<ActivateAccount />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Shared Routes */}
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    }
                />

                {/* Resident Routes */}
                <Route
                    path="/resident/register"
                    element={
                        <ProtectedRoute allowedRoles={["resident"]}>
                            <RegisterVisitor />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/resident/history"
                    element={
                        <ProtectedRoute allowedRoles={["resident"]}>
                            <ResidentHistory />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/resident/visitors/:id/edit"
                    element={
                        <ProtectedRoute allowedRoles={["resident"]}>
                            <EditVisitor />
                        </ProtectedRoute>
                    }
                />

                {/* Guard Routes */}
                <Route
                    path="/guard/scan"
                    element={
                        <ProtectedRoute allowedRoles={["guard"]}>
                            <QRScanner />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/guard/log"
                    element={
                        <ProtectedRoute allowedRoles={["guard"]}>
                            <GuardLog />
                        </ProtectedRoute>
                    }
                />

                {/* Admin Routes */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/residents"
                    element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                            <AdminUsers />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/units"
                    element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                            <AdminUnits />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/reports"
                    element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                            <AdminReports />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/settings"
                    element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                            <AdminSettings />
                        </ProtectedRoute>
                    }
                />

                {/* Unknown Route */}
                <Route path="*" element={<RootRedirect />} />

            </Routes>
            </Suspense>
        </BrowserRouter>
        </DialogProvider>
    );
}

export default App;
