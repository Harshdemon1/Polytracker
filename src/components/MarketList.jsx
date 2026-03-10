import MarketCard from './MarketCard';

export default function MarketList({
    markets,
    watchlist,
    onToggleWatchlist,
    onOpenModal,
    onLoadMore,
    loadingMore,
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

    const canLoadMore = totalLoaded < maxMarkets;

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

            {canLoadMore && (
                <div className="load-more-container">
                    <button
                        className="load-more-btn"
                        onClick={onLoadMore}
                        disabled={loadingMore}
                    >
                        {loadingMore ? (
                            <>
                                <span className="spinner-sm" /> Loading…
                            </>
                        ) : (
                            `Load More Markets (${totalLoaded} / ${maxMarkets})`
                        )}
                    </button>
                </div>
            )}

            {!canLoadMore && (
                <div className="load-more-container">
                    <p className="load-more-end">All {maxMarkets} top markets loaded</p>
                </div>
            )}
        </>
    );
}
