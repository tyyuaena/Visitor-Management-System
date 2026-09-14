// Mirrors the backend's password policy exactly (see
// backend/app/Support/PasswordPolicy.php: min 8 chars, mixed case,
// numbers) so a password that satisfies every item here is guaranteed to
// pass server-side validation too. Shared between PasswordRequirements.jsx
// (the visual checklist) and any page that needs the plain boolean without
// rendering it.
export const PASSWORD_REQUIREMENTS = [
    { label: "At least 8 characters", test: (v) => v.length >= 8 },
    { label: "An uppercase letter", test: (v) => /[A-Z]/.test(v) },
    { label: "A lowercase letter", test: (v) => /[a-z]/.test(v) },
    { label: "A number", test: (v) => /[0-9]/.test(v) },
];

export function passwordMeetsRequirements(value) {
    return PASSWORD_REQUIREMENTS.every((r) => r.test(value));
}
