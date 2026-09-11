import api from "./api";

// Verify QR
export const verifyQR = async (qrToken) => {
    const response = await api.post(
        "/guard/verify-qr",
        {
            qr_token: qrToken,
        }
    );
    return response.data;
};

// Approve visitor
export const approveVisitor = async (visitorId) => {
    const response = await api.post(
        `/guard/visitors/${visitorId}/approve`
    );
    return response.data;
};

// Reject visitor
export const rejectVisitor = async (
    visitorId,
    reason
) => {
    const response = await api.post(
        `/guard/visitors/${visitorId}/reject`,
        {
            reason,
        }
    );
    return response.data;
};

// Checkout visitor
export const checkoutVisitor = async (
    visitorId
) => {
    const response = await api.post(
        `/guard/visitors/${visitorId}/checkout`
    );
    return response.data;
};

// Visitor logs
export const getVisitorLogs = async () => {
    const response = await api.get(
        "/guard/visitor-logs"
    );
    return response.data;
};

// Recent QR verification attempts (successful and failed)
export const getVerificationAttempts = async () => {
    const response = await api.get(
        "/guard/verification-attempts"
    );
    return response.data;
};