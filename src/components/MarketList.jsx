import MarketCard from './MarketCard';

export default function MarketList({
    markets,
    watchlist,
    onToggleWatchlist,
    onOpenModal,
    totalLoaded,
    maxMarkets,
}) {
    if (markets.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3 className="empty-title">No active markets found</h3>
                <p className="empty-sub">Try adjusting your filters or lowering the minimum volume to see more markets.</p>
            </div>
        );
    }

    return (
        <>
            <div className="market-grid">
                {markets.map((m) => (
                    <MarketCard
                        key={m.id}
                        market={m}
                        isWatchlisted={watchlist.has(m.id)}
                        onToggleWatchlist={onToggleWatchlist}
                        onOpenModal={onOpenModal}
                    />
                ))}
            </div>

            {totalLoaded >= maxMarkets && (
                <div className="load-more-container">
                    <div className="load-more-track">
                        <div className="load-more-progress" style={{ width: '100%' }} />
                    </div>
                    <p className="load-more-count">All {maxMarkets} top markets loaded ✓</p>
                </div>
            )}
        </>
    );
}
