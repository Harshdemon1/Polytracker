import MarketCard from './MarketCard';

export default function MarketList({ markets }) {
    if (markets.length === 0) {
        return (
            <div className="empty-state">
                <span className="empty-icon">🔍</span>
                <p>No markets found. Try adjusting your filters.</p>
            </div>
        );
    }

    return (
        <div className="market-grid">
            {markets.map((market) => (
                <MarketCard key={market.id} market={market} />
            ))}
        </div>
    );
}
