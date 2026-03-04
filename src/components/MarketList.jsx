import MarketCard from './MarketCard';

export default function MarketList({ markets, watchlist, onToggleWatchlist, onOpenModal }) {
    if (markets.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3 className="empty-title">No markets found</h3>
                <p className="empty-sub">Try adjusting your filters or clearing them to see all markets.</p>
            </div>
        );
    }

    return (
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
    );
}
