import { useEffect, useState, memo } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { fetchPriceHistory } from '../api/polymarket';

const Sparkline = memo(function Sparkline({ tokenId, probability }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tokenId) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        fetchPriceHistory(tokenId, 60).then((history) => {
            if (cancelled) return;
            // Use last ~48 data points for the sparkline
            const trimmed = history.slice(-48).map(h => ({
                p: Math.round(parseFloat(h.p) * 100),
                t: h.t,
            }));
            setData(trimmed);
            setLoading(false);
        }).catch(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [tokenId]);

    // Fallback – generate a flat sparkline from current probability
    const fallback = Array.from({ length: 12 }, (_, i) => ({ p: probability ?? 50, t: i }));
    const chartData = data.length >= 3 ? data : fallback;

    // Determine trend colour
    const first = chartData[0]?.p ?? 50;
    const last = chartData[chartData.length - 1]?.p ?? 50;
    const color = last > first ? '#00e5c3' : last < first ? '#ef4444' : '#6366f1';

    if (loading) {
        return <div className="sparkline-placeholder" />;
    }

    return (
        <div className="sparkline-wrapper">
            <ResponsiveContainer width="100%" height={44}>
                <LineChart data={chartData}>
                    <Line
                        type="monotone"
                        dataKey="p"
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload?.length) {
                                return (
                                    <div className="sparkline-tooltip">
                                        {payload[0].value}%
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
});

export default Sparkline;
