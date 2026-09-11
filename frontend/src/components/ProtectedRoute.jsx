import { Navigate } from "react-router-dom";

import {
    getStoredUser,
    dashboardPathForRole,
} from "../services/authService";


// Guards a route behind a valid token and (optionally) a role check
export default function ProtectedRoute({ allowedRoles, children }) {

    const token = localStorage.getItem("token");
    const user = getStoredUser();

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (
        allowedRoles &&
        !allowedRoles.includes(user.role)
    ) {
        // Logged in, but wrong portal — send them to their own dashboard
        return (
            <Navigate
                to={dashboardPathForRole(user.role)}
                replace
            />
        );
    }

    return children;
}
