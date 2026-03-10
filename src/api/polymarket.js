import axios from 'axios';

const BASE_URL = '/api';
const CLOB_URL = '/clob';

const client = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

const clobClient = axios.create({
    baseURL: CLOB_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

export async function fetchMarkets({ limit = 100, offset = 0, volumeMin = 0 } = {}) {
    const params = {
        limit,
        offset,
        active: true,
        closed: false,
        archived: false,
    };

    if (volumeMin > 0) {
        params.volume_num_min = volumeMin;
    }

    // Use /events endpoint — returns curated events with nested markets
    const { data } = await client.get('/events', { params });
    const events = Array.isArray(data) ? data : (data?.data ?? []);

    // Flatten events → markets
    const markets = [];
    for (const event of events) {
        const eventMarkets = Array.isArray(event.markets) ? event.markets : [];
        for (const m of eventMarkets) {
            markets.push({ ...m, _event: event });
        }
    }

    return markets
        .filter((m) => {
            if (m.closed) return false;
            if (m.archived) return false;
            if (!m.enableOrderBook) return false;
            if (!m.endDate || new Date(m.endDate) <= new Date()) return false;
            return true;
        })
        .map((m) => ({
            id: m.id ?? m.slug,
            question: m.question,
            slug: m._event?.slug ?? m.slug,
            endDate: m.endDate,
            volume: m.volumeNum ?? parseFloat(m.volume) ?? 0,
            volume24hr: m._event?.volume24hr ?? m.volume24hr ?? 0,
            liquidity: m.liquidityNum ?? parseFloat(m.liquidity) ?? 0,
            outcomes: parseOutcomes(m),
            categories: m._event?.tags ?? m.tags ?? m.categories ?? [],
            image: m._event?.image ?? m.image ?? null,
            clobTokenIds: parseClobTokenIds(m),
            conditionId: m.conditionId ?? null,
            priceChange1d: m.oneDayPriceChange ?? null,
            priceChange1h: m.oneHourPriceChange ?? null,
            lastTradePrice: m.lastTradePrice ?? null,
        }))
        .sort((a, b) => b.volume - a.volume);
}

function parseClobTokenIds(market) {
    try {
        if (market.clobTokenIds) {
            const ids = typeof market.clobTokenIds === 'string'
                ? JSON.parse(market.clobTokenIds)
                : market.clobTokenIds;
            if (Array.isArray(ids) && ids.length > 0) return ids.filter(Boolean);
        }
        if (market.tokens) {
            const tokens = typeof market.tokens === 'string' ? JSON.parse(market.tokens) : market.tokens;
            if (Array.isArray(tokens)) return tokens.map(t => t.token_id ?? t.tokenId ?? t.id).filter(Boolean);
        }
        return [];
    } catch {
        return [];
    }
}

export async function fetchPriceHistory(tokenId, fidelity = 60) {
    if (!tokenId) return [];
    try {
        const { data } = await clobClient.get('/prices-history', {
            params: { market: tokenId, interval: 'max', fidelity }
        });
        const history = data?.history ?? data ?? [];
        return Array.isArray(history) ? history : [];
    } catch {
        return [];
    }
}

function parseOutcomes(market) {
    try {
        const prices = market.outcomePrices
            ? (typeof market.outcomePrices === 'string'
                ? JSON.parse(market.outcomePrices)
                : market.outcomePrices)
            : [];
        const outcomes = market.outcomes
            ? (typeof market.outcomes === 'string'
                ? JSON.parse(market.outcomes)
                : market.outcomes)
            : ['Yes', 'No'];
        return outcomes.map((label, i) => ({
            label,
            probability: prices[i] != null ? Math.round(parseFloat(prices[i]) * 100) : null,
        }));
    } catch {
        return [];
    }
}
