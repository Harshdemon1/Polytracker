import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchMarkets } from './api/polymarket';
import MarketList from './components/MarketList';
import FilterBar from './components/FilterBar';
import MarketModal from './components/MarketModal';
import './App.css';

const REFRESH_INTERVAL = 60000;
const MAX_MARKETS = 1000;

// Polymarket logo SVG (official mark)
const PolymarketLogo = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#0d0d0d" />
    <path d="M8 22V10h5.5c3.038 0 5 1.791 5 4.5S16.538 19 13.5 19H11v3H8zm3-6h2.4c1.38 0 2.1-.64 2.1-1.5S14.78 13 13.4 13H11v3zM19.5 22V14h2.7v1.2c.5-.85 1.4-1.35 2.55-1.35.2 0 .4.02.55.05v2.6a3.3 3.3 0 00-.7-.07c-1.35 0-2.4.8-2.4 2.4V22h-2.7z" fill="#fff" />
  </svg>
);

// Moon/Sun icons for theme toggle
const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
  </svg>
);
const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="2" x2="12" y2="5" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
    <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
    <line x1="2" y1="12" x2="5" y2="12" />
    <line x1="19" y1="12" x2="22" y2="12" />
    <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
    <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
  </svg>
);

export default function App() {
  const [markets, setMarkets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState({ category: '', sort: 'volume', volumeMin: 1000 });
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem('polytracker_watchlist');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('polytracker_theme') !== 'light'; } catch { return true; }
  });
  const timerRef = useRef(null);

  // Apply dark/light mode to root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    try { localStorage.setItem('polytracker_theme', darkMode ? 'dark' : 'light'); } catch { }
  }, [darkMode]);

  // Persist watchlist
  useEffect(() => {
    try { localStorage.setItem('polytracker_watchlist', JSON.stringify([...watchlist])); } catch { }
  }, [watchlist]);

  // Initial load and auto-refresh (always fetches from offset 0, limit = current count to preserve scroll position)
  const load = useCallback(async () => {
    try {
      setError(null);
      const currentCount = Math.max(100, markets.length);
      const data = await fetchMarkets({ limit: currentCount, offset: 0, volumeMin: filters.volumeMin });
      setMarkets(data);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message || 'Failed to fetch markets');
    } finally {
      setLoading(false);
    }
  }, [filters.volumeMin, markets.length]);

  // Load More: fetch next 100 and append
  const loadMore = useCallback(async () => {
    if (loadingMore || markets.length >= MAX_MARKETS) return;
    try {
      setLoadingMore(true);
      setError(null);
      const newOffset = offset + 100;
      const data = await fetchMarkets({ limit: 100, offset: newOffset, volumeMin: filters.volumeMin });
      setMarkets(prev => {
        // Deduplicate by id in case of overlap
        const existingIds = new Set(prev.map(m => m.id));
        const fresh = data.filter(m => !existingIds.has(m.id));
        return [...prev, ...fresh];
      });
      setOffset(newOffset);
    } catch (e) {
      setError(e.message || 'Failed to load more markets');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, markets.length, offset, filters.volumeMin]);

  useEffect(() => {
    setLoading(true);
    setOffset(0);
    setMarkets([]);
  }, [filters.volumeMin]);

  useEffect(() => {
    if (loading) {
      fetchMarkets({ limit: 100, offset: 0, volumeMin: filters.volumeMin })
        .then(data => {
          setMarkets(data);
          setLastUpdated(new Date());
        })
        .catch(e => setError(e.message || 'Failed to fetch markets'))
        .finally(() => setLoading(false));
    }
  }, [loading, filters.volumeMin]);

  useEffect(() => {
    timerRef.current = setInterval(load, REFRESH_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [load]);

  // Filter and sort
  useEffect(() => {
    let result = [...markets];
    if (showWatchlistOnly) {
      result = result.filter(m => watchlist.has(m.id));
    }
    if (filters.category) {
      result = result.filter((m) =>
        m.categories.some((c) =>
          (typeof c === 'string' ? c : c?.label ?? c?.name ?? '')
            .toLowerCase()
            .includes(filters.category.toLowerCase())
        )
      );
    }
    if (filters.sort === 'volume') {
      result.sort((a, b) => b.volume - a.volume);
    } else if (filters.sort === 'trending') {
      result.sort((a, b) => b.volume24hr - a.volume24hr);
    } else {
      // endDate ascending
      result.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
    }
    setFiltered(result);
  }, [markets, filters, showWatchlistOnly, watchlist]);

  const toggleWatchlist = useCallback((id) => {
    setWatchlist(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleWatchlistView = useCallback(() => {
    setShowWatchlistOnly(v => !v);
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <PolymarketLogo />
            <h1 className="brand-title">PolyTracker</h1>
            <span className="brand-badge">LIVE</span>
          </div>
          <div className="header-meta">
            {lastUpdated && (
              <span className="last-updated">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              className="theme-toggle"
              onClick={() => setDarkMode(v => !v)}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {darkMode ? <SunIcon /> : <MoonIcon />}
            </button>
            <button className="refresh-btn" onClick={load} disabled={loading}>
              {loading ? '⟳ Loading…' : '⟳ Refresh'}
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          showWatchlistOnly={showWatchlistOnly}
          onToggleWatchlist={toggleWatchlistView}
        />

        {error && (
          <div className="error-banner">
            ⚠️ {error} &mdash; <button onClick={load}>Retry</button>
          </div>
        )}

        {loading && markets.length === 0 ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Fetching markets from Polymarket…</p>
          </div>
        ) : (
          <MarketList
            markets={filtered}
            watchlist={watchlist}
            onToggleWatchlist={toggleWatchlist}
            onOpenModal={setSelectedMarket}
            onLoadMore={loadMore}
            loadingMore={loadingMore}
            totalLoaded={markets.length}
            maxMarkets={MAX_MARKETS}
          />
        )}
      </main>

      <footer className="footer">
        <p>Data sourced from <a href="https://polymarket.com" target="_blank" rel="noreferrer">Polymarket</a> · Auto-refreshes every 60s</p>
      </footer>

      {selectedMarket && (
        <MarketModal
          market={selectedMarket}
          onClose={() => setSelectedMarket(null)}
        />
      )}
    </div>
  );
}
