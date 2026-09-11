import api from "./api";

// Dashboard statistics
export const getDashboardStats = async () => {
    const response = await api.get("/admin/dashboard");
    return response.data;
};

// Users

export const getUsers = async (filters = {}) => {
    const response = await api.get("/admin/users", {
        params: filters,
    });
    return response.data;
};

export const createUser = async (data) => {
    const response = await api.post("/admin/users", data);
    return response.data;
};

export const updateUser = async (id, data) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
};

export const deactivateUser = async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
};

export const resendActivation = async (id) => {
    const response = await api.post(`/admin/users/${id}/resend-activation`);
    return response.data;
};

export const resetUserPassword = async (id) => {
    const response = await api.post(`/admin/users/${id}/reset-password`);
    return response.data;
};

// Units

export const getUnits = async () => {
    const response = await api.get("/admin/units");
    return response.data;
};

export const createUnit = async (data) => {
    const response = await api.post("/admin/units", data);
    return response.data;
};

export const updateUnit = async (id, data) => {
    const response = await api.put(`/admin/units/${id}`, data);
    return response.data;
};

export const deleteUnit = async (id) => {
    const response = await api.delete(`/admin/units/${id}`);
    return response.data;
};

// Visitors

export const getAdminVisitors = async (filters = {}) => {
    const response = await api.get("/admin/visitors", {
        params: filters,
    });
    return response.data;
};

// Audit logs

export const getAuditLogs = async (filters = {}) => {
    const response = await api.get("/admin/audit-logs", {
        params: filters,
    });
    return response.data;
};

// System settings

export const getSettings = async () => {
    const response = await api.get("/admin/settings");
    return response.data;
};

export const updateSettings = async (data) => {
    const response = await api.put("/admin/settings", data);
    return response.data;
};
