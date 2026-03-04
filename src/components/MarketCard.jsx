import { useState, useEffect } from 'react';
import Sparkline from './Sparkline';

// Per-category badge colors
const CATEGORY_COLORS = {
    politics: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', color: '#fca5a5' },
    crypto: { bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.35)', color: '#fde68a' },
    sports: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.35)', color: '#86efac' },
    finance: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.35)', color: '#a5b4fc' },
    tech: { bg: 'rgba(14,165,233,0.12)', border: 'rgba(14,165,233,0.35)', color: '#7dd3fc' },
    science: { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.35)', color: '#d8b4fe' },
    culture: { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.35)', color: '#fdba74' },
    geopolitics: { bg: 'rgba(20,184,166,0.12)', border: 'rgba(20,184,166,0.35)', color: '#5eead4' },
    elections: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', color: '#f87171' },
    economy: { bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.3)', color: '#4ade80' },
};

function getCategoryStyle(cat) {
    const key = Object.keys(CATEGORY_COLORS).find(k => cat.toLowerCase().includes(k));
    return CATEGORY_COLORS[key] ?? { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)', color: '#a5b4fc' };
}

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
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
    return `$${Math.round(n)}`;
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

export default function MarketCard({ market, isWatchlisted, onToggleWatchlist, onOpenModal }) {
    const [countdown, setCountdown] = useState(formatCountdown(market.endDate));

    useEffect(() => {
        const t = setInterval(() => setCountdown(formatCountdown(market.endDate)), 30000);
        return () => clearInterval(t);
    }, [market.endDate]);

    const endDateStr = new Date(market.endDate).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });

    const categoryLabels = market.categories
        .slice(0, 2)
        .map((c) => (typeof c === 'string' ? c : c?.label ?? c?.name ?? ''))
        .filter(Boolean);

    // Primary token for sparkline
    const primaryTokenId = market.clobTokenIds?.[0] ?? null;
    const primaryOutcome = market.outcomes?.[0];

    const handleCardClick = (e) => {
        e.preventDefault();
        onOpenModal(market);
    };

    const handleWatchlistClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleWatchlist(market.id);
    };

    return (
        <div
            className={`market-card ${isWatchlisted ? 'market-card-watchlisted' : ''}`}
            onClick={handleCardClick}
            role="button"
            tabIndex={0}
            aria-label={market.question}
            onKeyDown={(e) => e.key === 'Enter' && handleCardClick(e)}
        >
            <div className="card-top">
                <div className="card-categories">
                    {categoryLabels.map((cat) => {
                        const style = getCategoryStyle(cat);
                        return (
                            <span
                                key={cat}
                                className="category-badge"
                                style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.color }}
                            >
                                {cat}
                            </span>
                        );
                    })}
                </div>
                <div className="card-top-right">
                    <div className="card-countdown" title={`Ends ${endDateStr}`}>⏱ {countdown}</div>
                    <button
                        className={`watchlist-btn ${isWatchlisted ? 'watchlisted' : ''}`}
                        onClick={handleWatchlistClick}
                        title={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
                        aria-label={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
                    >
                        {isWatchlisted ? '★' : '☆'}
                    </button>
                </div>
            </div>

            <p className="card-question">{market.question}</p>

            {/* Sparkline */}
            {primaryTokenId && (
                <Sparkline tokenId={primaryTokenId} probability={primaryOutcome?.probability} />
            )}

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
                {market.priceChange1d != null && (
                    <div className="card-stat card-stat-change">
                        <span className="stat-label">24h</span>
                        <span className={`stat-change ${market.priceChange1d >= 0 ? 'change-up' : 'change-down'}`}>
                            {market.priceChange1d >= 0 ? '▲' : '▼'} {Math.abs(Math.round(market.priceChange1d * 100))}%
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
