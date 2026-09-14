import { PASSWORD_REQUIREMENTS } from "../../utils/passwordPolicy";

// Shown as soon as the field is focused/typed into, not only after a failed
// submit — so the user finds out a password is too weak while they're still
// typing it, not after clicking submit and getting bounced back.
export default function PasswordRequirements({ value }) {
    return (
        <ul className="mt-1.5 space-y-1">
            {PASSWORD_REQUIREMENTS.map(({ label, test }) => {
                const met = test(value);
                return (
                    <li
                        key={label}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${met ? "text-success" : "text-text-muted"
                            }`}
                    >
                        <span className="w-3.5 shrink-0">{met ? "✓" : "•"}</span>
                        {label}
                    </li>
                );
            })}
        </ul>
    );
}
