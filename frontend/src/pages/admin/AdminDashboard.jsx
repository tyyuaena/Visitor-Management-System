import { useEffect, useState } from "react";

import { getDashboardStats } from "../../services/adminService";
import TopNav from "../../components/nav/TopNav";

const TABS = [
    { label: "Overview", to: "/admin" },
    { label: "Residents", to: "/admin/residents" },
    { label: "Units", to: "/admin/units" },
    { label: "Reports", to: "/admin/reports" },
    { label: "Settings", to: "/admin/settings" },
];

const BAR_COLORS = ["bg-primary", "bg-cyan"];

function AdminDashboard() {

    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const data = await getDashboardStats();
            setStatistics(data.statistics);

        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Failed to load dashboard."
            );
        } finally {
            setLoading(false);
        }
    };

    const weeklyVolume = statistics?.weekly_volume || [];
    const maxCount = Math.max(1, ...weeklyVolume.map((d) => d.count));

    return (
        <div className="min-h-screen bg-bg">

            <TopNav tabs={TABS} />

            <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto p-5 lg:p-8">

                {loading && (
                    <p className="text-text-muted text-sm">Loading dashboard...</p>
                )}

                {error && (
                    <div className="bg-danger-bg text-danger text-sm p-3 rounded-lg">
                        {error}
                    </div>
                )}

                {statistics && (
                    <>
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <StatCard label="Today" value={statistics.today} valueClass="text-text" />
                            <StatCard label="In" value={statistics.active_visitors} valueClass="text-primary" />
                            <StatCard label="Rejected" value={statistics.rejected} valueClass="text-danger" />
                            <StatCard label="Avg time" value={`${statistics.avg_visit_minutes}m`} valueClass="text-cyan" />
                        </div>

                        <div className="bg-surface border border-border rounded-2xl p-5 mb-5">
                            <h2 className="text-sm font-semibold text-text mb-4">
                                Weekly visitor volume
                            </h2>

                            <div className="flex items-end justify-between gap-2 h-24">
                                {weeklyVolume.map((day, index) => (
                                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                        <div className="w-full flex items-end justify-center h-16">
                                            <div
                                                className={`w-full max-w-6 rounded-md ${BAR_COLORS[index % BAR_COLORS.length]}`}
                                                style={{
                                                    height: `${Math.max(6, (day.count / maxCount) * 100)}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-[11px] text-text-muted font-medium">
                                            {day.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-surface border border-border rounded-2xl p-5">
                            <h2 className="text-sm font-semibold text-text mb-3">
                                Overall
                            </h2>
                            <div className="grid grid-cols-2 gap-y-3 text-sm">
                                <SummaryRow label="Residents" value={statistics.residents} />
                                <SummaryRow label="Guards" value={statistics.guards} />
                                <SummaryRow label="Total visitors" value={statistics.total_visitors} />
                                <SummaryRow label="Upcoming" value={statistics.upcoming} />
                                <SummaryRow label="Checked out" value={statistics.checked_out} />
                                <SummaryRow label="Cancelled" value={statistics.cancelled} />
                                <SummaryRow label="Expired" value={statistics.expired} />
                            </div>
                        </div>
                    </>
                )}

            </div>

        </div>
    );
}

function StatCard({ label, value, valueClass }) {
    return (
        <div className="bg-surface border border-border rounded-2xl p-4">
            <p className={`text-2xl font-bold ${valueClass}`}>
                {value}
            </p>
            <p className="text-xs text-text-muted mt-1">
                {label}
            </p>
        </div>
    );
}

function SummaryRow({ label, value }) {
    return (
        <div>
            <p className="text-text-muted text-xs">{label}</p>
            <p className="text-text font-semibold">{value}</p>
        </div>
    );
}

export default AdminDashboard;
