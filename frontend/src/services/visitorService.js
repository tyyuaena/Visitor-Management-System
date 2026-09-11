import api from "./api";

// Get all visitors belonging to the resident
export const getVisitors = async () => {
    const response = await api.get("/resident/visitors");
    return response.data;
};

// Register visitor
export const registerVisitor = async (visitorData) => {
    const response = await api.post(
        "/resident/visitors",
        visitorData
    );
    return response.data;
};

// Get one visitor
export const getVisitor = async (id) => {
    const response = await api.get(
        `/resident/visitors/${id}`
    );
    return response.data;
};

// Update visitor
export const updateVisitor = async (id, visitorData) => {
    const response = await api.put(
        `/resident/visitors/${id}`,
        visitorData
    );
    return response.data;
};

// Cancel visitor
export const cancelVisitor = async (id) => {
    const response = await api.delete(
        `/resident/visitors/${id}`
    );
    return response.data;
};

// Get visitor QR code
export const getVisitorQR = async (id) => {
    const response = await api.get(
        `/resident/visitors/${id}/qr`,
        {
            responseType: "blob",
        }
    );
    return response.data;
};

// Regenerate a visitor's QR code, invalidating the previous one
export const regenerateVisitorQR = async (id) => {
    const response = await api.post(
        `/resident/visitors/${id}/qr/regenerate`
    );
    return response.data;
};