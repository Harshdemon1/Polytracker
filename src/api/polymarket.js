import axios from 'axios';

// In development, requests go through the Vite proxy (/api → https://gamma-api.polymarket.com)
// to avoid CORS issues.
const BASE_URL = '/api';
const CLOB_URL = '/clob'; // Proxied to https://clob.polymarket.com

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

export async function fetchMarkets({ limit = 100, volumeMin = 0 } = {}) {
    const params = {
        limit,
        active: true,
        closed: false,
    };

    if (volumeMin > 0) {
        params.volume_num_min = volumeMin;
    }

    const { data } = await client.get('/markets', { params });
    const markets = Array.isArray(data) ? data : (data?.data ?? []);

    return markets
        .filter((m) => !m.closed && m.endDate && new Date(m.endDate) > new Date())
        .map((m) => ({
            id: m.id ?? m.slug,
            question: m.question,
            slug: m.events?.[0]?.slug ?? m.slug,
            endDate: m.endDate,
            volume: m.volumeNum ?? parseFloat(m.volume) ?? 0,
            liquidity: m.liquidityNum ?? parseFloat(m.liquidity) ?? 0,
            outcomes: parseOutcomes(m),
            categories: m.tags ?? m.categories ?? [],
            image: m.image ?? null,
            clobTokenIds: parseClobTokenIds(m),
            conditionId: m.conditionId ?? null,
            priceChange1d: m.oneDayPriceChange ?? null,
            priceChange1h: m.oneHourPriceChange ?? null,
            lastTradePrice: m.lastTradePrice ?? null,
        }))
        .sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
}

function parseClobTokenIds(market) {
    try {
        // The API returns clobTokenIds as a JSON-encoded string: "[\"123...\", \"456...\"]"
        if (market.clobTokenIds) {
            const ids = typeof market.clobTokenIds === 'string'
                ? JSON.parse(market.clobTokenIds)
                : market.clobTokenIds;
            if (Array.isArray(ids) && ids.length > 0) return ids.filter(Boolean);
        }
        // Fallback: tokens array with token_id field
        if (market.tokens) {
            const tokens = typeof market.tokens === 'string' ? JSON.parse(market.tokens) : market.tokens;
            if (Array.isArray(tokens)) return tokens.map(t => t.token_id ?? t.tokenId ?? t.id).filter(Boolean);
        }
        return [];
    } catch {
        return [];
    }
}

/**
 * Fetches price history for a market token from Polymarket CLOB API.
 * Returns array of { t: timestamp, p: price } objects.
 */
export async function fetchPriceHistory(tokenId, fidelity = 60) {
    if (!tokenId) return [];
    try {
        const { data } = await clobClient.get('/prices-history', {
            params: {
                market: tokenId,
                interval: 'max',
                fidelity,
            }
        });
        // API returns { history: [{t, p}, ...] }
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
