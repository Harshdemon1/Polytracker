import { useState, useEffect } from 'react';

function formatCountdown(endDate) {
    const diff = new Date(endDate) - new Date();
    if (diff <= 0) return 'Closing soon';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
}

function formatVolume(n) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n}`;
}

function OutcomePill({ outcome }) {
    const pct = outcome.probability;
    const isHigh = pct >= 60;
    const isMid = pct >= 40;
    return (
        <div className={`outcome-pill ${isHigh ? 'outcome-high' : isMid ? 'outcome-mid' : 'outcome-low'}`}>
            <span className="outcome-label">{outcome.label}</span>
            {pct != null && <span className="outcome-pct">{pct}%</span>}
        </div>
    );
}

export default function MarketCard({ market }) {
    const [countdown, setCountdown] = useState(formatCountdown(market.endDate));

    useEffect(() => {
        const t = setInterval(() => setCountdown(formatCountdown(market.endDate)), 30000);
        return () => clearInterval(t);
    }, [market.endDate]);

    const marketUrl = `https://polymarket.com/event/${market.slug}`;
    const endDateStr = new Date(market.endDate).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });

    const categoryLabels = market.categories
        .slice(0, 2)
        .map((c) => (typeof c === 'string' ? c : c?.label ?? c?.name ?? ''))
        .filter(Boolean);

    return (
        <a
            href={marketUrl}
            target="_blank"
            rel="noreferrer"
            className="market-card"
            aria-label={market.question}
        >
            <div className="card-top">
                <div className="card-categories">
                    {categoryLabels.map((cat) => (
                        <span key={cat} className="category-badge">{cat}</span>
                    ))}
                </div>
                <div className="card-countdown" title={`Ends ${endDateStr}`}>
                    ⏱ {countdown}
                </div>
            </div>

            <p className="card-question">{market.question}</p>

            {market.outcomes.length > 0 && (
                <div className="card-outcomes">
                    {market.outcomes.slice(0, 4).map((o) => (
                        <OutcomePill key={o.label} outcome={o} />
                    ))}
                </div>
            )}

            <div className="card-footer">
                <div className="card-stat">
                    <span className="stat-label">Volume</span>
                    <span className="stat-value">{formatVolume(market.volume)}</span>
                </div>
                <div className="card-stat">
                    <span className="stat-label">Liquidity</span>
                    <span className="stat-value">{formatVolume(market.liquidity)}</span>
                </div>
                <div className="card-stat">
                    <span className="stat-label">Ends</span>
                    <span className="stat-value">{endDateStr}</span>
                </div>
            </div>
        </a>
    );
}
