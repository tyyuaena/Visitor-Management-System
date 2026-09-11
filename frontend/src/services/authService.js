import api from "./api";

// Log in and persist the token/user
export const login = async (email, password) => {
    const response = await api.post("/auth/login", {
        email,
        password,
    });

    const { token, user } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    return response.data;
};

// Log out, revoking the token server-side, then clear local state
export const logout = async () => {
    try {
        await api.post("/auth/logout");
    } finally {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    }
};

// Activate an admin-created account and set its initial password
export const activateAccount = async ({ email, token, password, password_confirmation }) => {
    const response = await api.post("/auth/activate", {
        email, token, password, password_confirmation,
    });
    return response.data;
};

// Request a password reset link
export const forgotPassword = async (email) => {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
};

// Complete a password reset
export const resetPassword = async ({ email, token, password, password_confirmation }) => {
    const response = await api.post("/auth/reset-password", {
        email, token, password, password_confirmation,
    });
    return response.data;
};

// Change password while logged in
export const changePassword = async ({ current_password, password, password_confirmation }) => {
    const response = await api.post("/auth/change-password", {
        current_password, password, password_confirmation,
    });
    return response.data;
};

// Fetch the current user's own profile from the server
export const fetchProfile = async () => {
    const response = await api.get("/auth/user");
    return response.data;
};

// Read the currently stored user (or null)
export const getStoredUser = () => {
    try {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        console.error("Unable to read stored user:", error);
        return null;
    }
};

// Where a given role should land after login
export const dashboardPathForRole = (role) => {
    switch (role) {
        case "guard":
            return "/guard/scan";
        case "admin":
            return "/admin";
        case "resident":
        default:
            return "/resident/history";
    }
};
