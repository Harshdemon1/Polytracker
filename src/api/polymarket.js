import axios from 'axios';

// In development, requests go through the Vite proxy (/api → https://gamma-api.polymarket.com)
// to avoid CORS issues.
const BASE_URL = '/api';

const client = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

export async function fetchMarkets({ limit = 100, volumeMin = 0 } = {}) {
    const params = {
        limit,
        active: true,
        closed: false,
    };

    // Only add volume filter when > 0
    if (volumeMin > 0) {
        params.volume_num_min = volumeMin;
    }

    const { data } = await client.get('/markets', { params });

    // API returns a plain array
    const markets = Array.isArray(data) ? data : (data?.data ?? []);

    return markets
        .filter((m) => !m.closed && m.endDate && new Date(m.endDate) > new Date())
        .map((m) => ({
            id: m.id ?? m.slug,
            question: m.question,
            slug: m.slug,
            endDate: m.endDate,
            volume: m.volumeNum ?? parseFloat(m.volume) ?? 0,
            liquidity: m.liquidityNum ?? parseFloat(m.liquidity) ?? 0,
            outcomes: parseOutcomes(m),
            categories: m.tags ?? m.categories ?? [],
            image: m.image ?? null,
        }))
        .sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
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
