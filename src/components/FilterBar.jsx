export default function FilterBar({ filters, onChange, showWatchlistOnly, onToggleWatchlist }) {
    const set = (key, value) => onChange((prev) => ({ ...prev, [key]: value }));

    const isDefault = !filters.category && filters.sort === 'endDate' && filters.volumeMin === 1000 && !showWatchlistOnly;

    return (
        <div className="filter-bar">
            <div className="filter-group">
                <label htmlFor="category-filter">Category</label>
                <input
                    id="category-filter"
                    type="text"
                    placeholder="e.g. Politics, Crypto…"
                    value={filters.category}
                    onChange={(e) => set('category', e.target.value)}
                    className="filter-input"
                />
            </div>

            <div className="filter-group">
                <label htmlFor="sort-select">Sort by</label>
                <select
                    id="sort-select"
                    value={filters.sort}
                    onChange={(e) => set('sort', e.target.value)}
                    className="filter-select"
                >
                    <option value="endDate">End Date (Soonest)</option>
                    <option value="volume">Volume (Highest)</option>
                    <option value="liquidity">Liquidity (Highest)</option>
                </select>
            </div>

            <div className="filter-group">
                <label htmlFor="volume-filter">Min Volume</label>
                <select
                    id="volume-filter"
                    value={filters.volumeMin}
                    onChange={(e) => set('volumeMin', Number(e.target.value))}
                    className="filter-select"
                >
                    <option value={0}>Any</option>
                    <option value={1000}>$1K+</option>
                    <option value={10000}>$10K+</option>
                    <option value={100000}>$100K+</option>
                    <option value={1000000}>$1M+</option>
                </select>
            </div>

            <button
                className={`watchlist-filter-btn ${showWatchlistOnly ? 'active' : ''}`}
                onClick={onToggleWatchlist}
            >
                {showWatchlistOnly ? '★ My Watchlist' : '☆ My Watchlist'}
            </button>

            {!isDefault && (
                <button
                    className="filter-clear"
                    onClick={() => {
                        onChange({ category: '', sort: 'endDate', volumeMin: 1000 });
                        if (showWatchlistOnly) onToggleWatchlist();
                    }}
                >
                    Clear All Filters
                </button>
            )}
        </div>
    );
}
