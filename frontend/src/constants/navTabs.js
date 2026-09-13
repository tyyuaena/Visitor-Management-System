// Shared nav-tab definitions per role, so every page that mounts <TopNav>
// stays in sync — previously each page redeclared its own copy and one
// (Profile.jsx) had already drifted out of date (missing the Units tab).

export const ADMIN_TABS = [
    { label: "Overview", to: "/admin" },
    { label: "Residents", to: "/admin/residents" },
    { label: "Units", to: "/admin/units" },
    { label: "Reports", to: "/admin/reports" },
    { label: "Settings", to: "/admin/settings" },
];

export const RESIDENT_TABS = [
    { label: "Register", to: "/resident/register" },
    { label: "History", to: "/resident/history" },
];

export const GUARD_TABS = [
    { label: "Scan", to: "/guard/scan" },
    { label: "Log", to: "/guard/log" },
];

export const TABS_BY_ROLE = {
    resident: RESIDENT_TABS,
    guard: GUARD_TABS,
    admin: ADMIN_TABS,
};
