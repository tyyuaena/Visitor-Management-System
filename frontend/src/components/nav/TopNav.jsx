import { NavLink } from "react-router-dom";
import { logout } from "../../services/authService";

export default function TopNav({ tabs }) {
    const handleLogout = async () => {
        await logout();
        window.location.href = "/login";
    };

    return (
        <header className="sticky top-0 z-40 bg-surface border-b border-border">
            <div className="flex items-center gap-2 px-4 h-14">

                <span className="text-lg font-bold tracking-tight text-text shrink-0">
                    VMS
                </span>

                {/* min-w-0 lets this flex item shrink below its content width,
                    which is what allows overflow-x-auto to actually scroll
                    instead of pushing the icons off the edge of the screen. */}
                <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 min-w-0">
                    {tabs.map((tab) => (
                        <NavLink
                            key={tab.to}
                            to={tab.to}
                            end
                            className={({ isActive }) =>
                                `shrink-0 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                                    isActive
                                        ? "bg-primary text-white"
                                        : "text-text-muted hover:text-text"
                                }`
                            }
                        >
                            {tab.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="flex items-center gap-1 shrink-0">
                    <NavLink
                        to="/profile"
                        aria-label="Profile"
                        className={({ isActive }) =>
                            `w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                                isActive
                                    ? "text-primary bg-primary/15"
                                    : "text-text-muted hover:text-text hover:bg-white/5"
                            }`
                        }
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <circle cx="12" cy="8" r="4" />
                            <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" />
                        </svg>
                    </NavLink>

                    <button
                        onClick={handleLogout}
                        aria-label="Log out"
                        className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:text-danger hover:bg-danger-bg transition-colors"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </button>
                </div>

            </div>
        </header>
    );
}
