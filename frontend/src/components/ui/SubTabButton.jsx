export default function SubTabButton({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active ? "bg-primary text-white" : "bg-surface-alt text-text-muted border border-border"
            }`}
        >
            {children}
        </button>
    );
}
