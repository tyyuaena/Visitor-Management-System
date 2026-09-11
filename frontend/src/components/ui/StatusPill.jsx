const STATUS_STYLES = {
    upcoming: "bg-cyan/15 text-cyan",
    checked_in: "bg-success-bg text-success",
    checked_out: "bg-primary/15 text-primary",
    rejected: "bg-danger-bg text-danger",
    cancelled: "bg-white/10 text-text-muted",
    expired: "bg-warning-bg text-warning",
};

const STATUS_LABELS = {
    upcoming: "Upcoming",
    checked_in: "Checked In",
    checked_out: "Checked Out",
    rejected: "Rejected",
    cancelled: "Cancelled",
    expired: "Expired",
};

export default function StatusPill({ status }) {
    const style = STATUS_STYLES[status] || "bg-white/10 text-text-muted";
    const label = STATUS_LABELS[status] || status;

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${style}`}>
            {label}
        </span>
    );
}
