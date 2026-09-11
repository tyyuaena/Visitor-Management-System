import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import { getStoredUser, dashboardPathForRole } from "./services/authService";

// Auth pages
import Login from "./pages/auth/Login";
import ActivateAccount from "./pages/auth/ActivateAccount";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Shared pages
import Profile from "./pages/Profile";

// Resident pages
import RegisterVisitor from "./pages/resident/RegisterVisitor";
import ResidentHistory from "./pages/resident/ResidentHistory";
import EditVisitor from "./pages/resident/EditVisitor";

// Guard Pages
import QRScanner from "./pages/guard/QRScanner";
import GuardLog from "./pages/guard/GuardLog";

// Admin Page
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUnits from "./pages/admin/AdminUnits";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";


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


function App() {
    return (
        <BrowserRouter>
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
        </BrowserRouter>
    );
}

export default App;
