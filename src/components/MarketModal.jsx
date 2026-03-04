import { useEffect, useState, useCallback } from 'react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { fetchPriceHistory } from '../api/polymarket';

const TIME_RANGES = [
    { label: '1H', fidelity: 1, points: 60 },
    { label: '6H', fidelity: 1, points: 360 },
    { label: '1D', fidelity: 10, points: 144 },
    { label: '1W', fidelity: 60, points: 168 },
    { label: '1M', fidelity: 240, points: 180 },
    { label: 'ALL', fidelity: 60, points: null },
];

const OUTCOME_COLORS = ['#00e5c3', '#f59e0b', '#818cf8', '#f97316', '#ec4899'];

function formatDate(ts) {
    const d = new Date(ts * 1000);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatVolume(n) {
    if (!n) return '$0';
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
    return `$${n.toFixed(2)}`;
}

function formatLiquidity(n) {
    if (!n) return '$0';
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
    return `$${Math.round(n)}`;
}

export default function MarketModal({ market, onClose }) {
    const [rangeIdx, setRangeIdx] = useState(4); // Default: 1M
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Close on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    // Prevent body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const loadChart = useCallback(async () => {
        if (!market?.clobTokenIds?.length) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const range = TIME_RANGES[rangeIdx];

        try {
            // Fetch history for each outcome token in parallel
            const allHistories = await Promise.all(
                market.clobTokenIds.slice(0, 4).map(tid => fetchPriceHistory(tid, range.fidelity))
            );

            // Build joined dataset by timestamp
            const tsMap = new Map();
            allHistories.forEach((hist, oi) => {
                const trimmed = range.points ? hist.slice(-range.points) : hist;
                trimmed.forEach(pt => {
                    if (!tsMap.has(pt.t)) tsMap.set(pt.t, { t: pt.t });
                    tsMap.get(pt.t)[`outcome_${oi}`] = Math.round(parseFloat(pt.p) * 100);
                });
            });

            const merged = Array.from(tsMap.values()).sort((a, b) => a.t - b.t);
            setChartData(merged);
        } catch {
            setChartData([]);
        } finally {
            setLoading(false);
        }
    }, [market, rangeIdx]);

    useEffect(() => { loadChart(); }, [loadChart]);

    if (!market) return null;

    const endDateStr = new Date(market.endDate).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });

    const categoryLabels = market.categories
        .slice(0, 3)
        .map((c) => (typeof c === 'string' ? c : c?.label ?? c?.name ?? ''))
        .filter(Boolean);

    const marketUrl = `https://polymarket.com/event/${market.slug}`;

    // Determine primary outcome's current probability and change
    const primaryOutcome = market.outcomes?.[0];
    const primaryPct = primaryOutcome?.probability ?? 0;

    // Compute change from chart data
    let changeVal = null;
    if (chartData.length >= 2) {
        const firstPt = chartData[0]?.outcome_0;
        const lastPt = chartData[chartData.length - 1]?.outcome_0;
        if (firstPt != null && lastPt != null) {
            changeVal = lastPt - firstPt;
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-panel"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={market.question}
            >
                {/* Header */}
                <div className="modal-header">
                    <div className="modal-header-left">
                        <div className="modal-categories">
                            {categoryLabels.map(cat => (
                                <span key={cat} className={`category-badge cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}>{cat}</span>
                            ))}
                        </div>
                        <h2 className="modal-title">{market.question}</h2>
                        <div className="modal-meta">
                            <span className="modal-prob">
                                {primaryPct}% chance
                            </span>
                            {changeVal !== null && (
                                <span className={`modal-change ${changeVal >= 0 ? 'change-up' : 'change-down'}`}>
                                    {changeVal >= 0 ? '▲' : '▼'} {Math.abs(changeVal)}%
                                </span>
                            )}
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
                </div>

                {/* Chart */}
                <div className="modal-chart-area">
                    {loading ? (
                        <div className="modal-chart-loading">
                            <div className="spinner" />
                            <span>Loading chart…</span>
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="modal-chart-empty">
                            <span>No historical data available</span>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                                <defs>
                                    {market.outcomes.slice(0, 4).map((_, i) => (
                                        <linearGradient key={i} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={OUTCOME_COLORS[i]} stopOpacity={0.18} />
                                            <stop offset="95%" stopColor={OUTCOME_COLORS[i]} stopOpacity={0} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis
                                    dataKey="t"
                                    tickFormatter={formatDate}
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    minTickGap={60}
                                />
                                <YAxis
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => `${v}%`}
                                    domain={[0, 100]}
                                    width={40}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: '#1a2235',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        color: '#f1f5f9',
                                    }}
                                    labelFormatter={formatDate}
                                    formatter={(val, name) => [`${val}%`, name]}
                                />
                                {market.outcomes.slice(0, 4).map((o, i) => (
                                    <Area
                                        key={o.label}
                                        type="monotone"
                                        dataKey={`outcome_${i}`}
                                        name={o.label}
                                        stroke={OUTCOME_COLORS[i]}
                                        strokeWidth={2}
                                        fill={`url(#grad${i})`}
                                        dot={false}
                                        isAnimationActive={false}
                                        connectNulls
                                    />
                                ))}
                                {market.outcomes.length > 1 && (
                                    <Legend
                                        wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                                        formatter={(val) => <span style={{ color: '#94a3b8' }}>{val}</span>}
                                    />
                                )}
                            </AreaChart>
                        </ResponsiveContainer>
                    )}

                    {/* Time range tabs */}
                    <div className="modal-time-tabs">
                        {TIME_RANGES.map((r, i) => (
                            <button
                                key={r.label}
                                className={`time-tab ${rangeIdx === i ? 'active' : ''}`}
                                onClick={() => setRangeIdx(i)}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Outcomes table */}
                <div className="modal-outcomes-table">
                    {market.outcomes.slice(0, 6).map((o, i) => (
                        <div key={o.label} className="modal-outcome-row">
                            <span className="moutcome-dot" style={{ background: OUTCOME_COLORS[i] }} />
                            <span className="moutcome-label">{o.label}</span>
                            <span className="moutcome-pct">{o.probability ?? '—'}%</span>
                        </div>
                    ))}
                </div>

                {/* Footer stats */}
                <div className="modal-stats">
                    <div className="modal-stat">
                        <span className="modal-stat-label">Volume</span>
                        <span className="modal-stat-value">{formatVolume(market.volume)}</span>
                    </div>
                    <div className="modal-stat">
                        <span className="modal-stat-label">Liquidity</span>
                        <span className="modal-stat-value">{formatLiquidity(market.liquidity)}</span>
                    </div>
                    <div className="modal-stat">
                        <span className="modal-stat-label">Ends</span>
                        <span className="modal-stat-value">{endDateStr}</span>
                    </div>
                    <div className="modal-stat">
                        <a href={marketUrl} target="_blank" rel="noreferrer" className="modal-trade-btn">
                            View on Polymarket ↗
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
