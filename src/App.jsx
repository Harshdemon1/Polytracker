import { useState, useEffect, useRef } from 'react';
import { fetchMarkets } from './api/polymarket';
import MarketList from './components/MarketList';
import FilterBar from './components/FilterBar';
import './App.css';

const REFRESH_INTERVAL = 60000; // 60s

export default function App() {
  const [markets, setMarkets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filters, setFilters] = useState({ category: '', sort: 'endDate', volumeMin: 1000 });
  const timerRef = useRef(null);

  const load = async () => {
    try {
      setError(null);
      const data = await fetchMarkets({ limit: 100, volumeMin: filters.volumeMin });
      setMarkets(data);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message || 'Failed to fetch markets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    timerRef.current = setInterval(load, REFRESH_INTERVAL);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.volumeMin]);

  useEffect(() => {
    let result = [...markets];

    // Filter by category
    if (filters.category) {
      result = result.filter((m) =>
        m.categories.some((c) =>
          (typeof c === 'string' ? c : c?.label ?? c?.name ?? '')
            .toLowerCase()
            .includes(filters.category.toLowerCase())
        )
      );
    }

    // Sort
    if (filters.sort === 'volume') {
      result.sort((a, b) => b.volume - a.volume);
    } else if (filters.sort === 'liquidity') {
      result.sort((a, b) => b.liquidity - a.liquidity);
    } else {
      result.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
    }

    setFiltered(result);
  }, [markets, filters.category, filters.sort]);

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-icon">📈</span>
            <h1 className="brand-title">Polymarket Tracker</h1>
            <span className="brand-badge">LIVE</span>
          </div>
          <div className="header-meta">
            {lastUpdated && (
              <span className="last-updated">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button className="refresh-btn" onClick={load} disabled={loading}>
              {loading ? '⟳ Loading…' : '⟳ Refresh'}
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <FilterBar filters={filters} onChange={setFilters} />

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
          <MarketList markets={filtered} />
        )}
      </main>

      <footer className="footer">
        <p>Data sourced from <a href="https://polymarket.com" target="_blank" rel="noreferrer">Polymarket</a> · Auto-refreshes every 60s</p>
      </footer>
    </div>
  );
}
