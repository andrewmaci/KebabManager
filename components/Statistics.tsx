import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaPoll, FaTrophy } from 'react-icons/fa';
import type { KebabOrder } from '../types';

interface StatisticsProps {
  allOrders: { [key: string]: KebabOrder[] };
}

const RankIcon: React.FC<{ rank: number }> = ({ rank }) => {
    if (rank === 1) return <FaTrophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <FaTrophy className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <FaTrophy className="w-6 h-6 text-yellow-600" />;
    return <span className="text-slate-500 dark:text-slate-400 w-6 text-center">{rank}</span>;
}

const Statistics: React.FC<StatisticsProps> = ({ allOrders }) => {
  const [chartTimespan, setChartTimespan] = useState<'day' | 'week' | 'month'>('day');

  const {
    leaderboardData,
    totalKebabCount,
    chartData,
  } = useMemo(() => {
    const flatOrders = Object.values(allOrders).flat();
    
    // Leaderboard
    const counts: { [name: string]: number } = {};
    flatOrders.forEach(order => {
      const name = order.customerName.trim();
      if (name) {
        counts[name] = (counts[name] || 0) + 1;
      }
    });
    const leaderboard = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Total Kebab Count
    const total = flatOrders.length;

    // Chart Data
    const dailyCounts: { [date: string]: number } = {};
    for (const [date, orders] of Object.entries(allOrders)) {
        dailyCounts[date] = (dailyCounts[date] || 0) + orders.length;
    }

    let processedChartData;
    const today = new Date();
    
    if (chartTimespan === 'day') {
        processedChartData = Object.entries(dailyCounts).map(([date, count]) => ({
            name: date,
            kebabów: count,
        })).sort((a,b) => a.name.localeCompare(b.name));
    } else if (chartTimespan === 'week') {
        const weeklyCounts: { [week: string]: number } = {};
        Object.entries(dailyCounts).forEach(([date, count]) => {
            const d = new Date(date);
            const year = d.getUTCFullYear();
            const week = Math.ceil((((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + 1) / 7);
            const weekKey = `${year}-W${week.toString().padStart(2, '0')}`;
            weeklyCounts[weekKey] = (weeklyCounts[weekKey] || 0) + count;
        });
        processedChartData = Object.entries(weeklyCounts).map(([name, count]) => ({ name, kebabów: count })).sort((a,b) => a.name.localeCompare(b.name));
    } else { // month
        const monthlyCounts: { [month: string]: number } = {};
        Object.entries(dailyCounts).forEach(([date, count]) => {
            const monthKey = date.substring(0, 7); // YYYY-MM
            monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + count;
        });
        processedChartData = Object.entries(monthlyCounts).map(([name, count]) => ({ name, kebabów: count })).sort((a,b) => a.name.localeCompare(b.name));
    }

    return {
      leaderboardData: leaderboard,
      totalKebabCount: total,
      chartData: processedChartData,
    };
  }, [allOrders, chartTimespan]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Leaderboard */}
      <div className="md:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <FaPoll className="w-7 h-7 text-amber-500" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Mistrzowie Bedasa</h2>
        </div>
        <ol className="space-y-3" style={{maxHeight: 'calc(100vh - 250px)', overflowY: 'auto'}}>
          {leaderboardData.map((entry, index) => (
            <li key={entry.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
              <div className="flex items-center gap-4">
                <RankIcon rank={index + 1} />
                <span className="font-semibold text-slate-700 dark:text-slate-200">{entry.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-amber-600 dark:text-amber-500">{entry.count}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">x 🌯</span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Stats and Chart Column */}
      <div className="md:col-span-1 space-y-8">
        {/* Total Stats */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg text-center">
            <h3 className="text-lg font-semibold text-slate-500 dark:text-slate-400">Całkowita liczba zamówionych kebabów</h3>
            <p className="text-5xl font-bold text-amber-600 dark:text-amber-500 mt-2">{totalKebabCount}</p>
        </div>

        {/* Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Zjedzone kebaby</h3>
              <div className="flex gap-1 bg-slate-200 dark:bg-slate-700 p-1 rounded-md">
                  <button onClick={() => setChartTimespan('day')} className={`px-3 py-1 text-sm rounded ${chartTimespan === 'day' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}>Dzień</button>
                  <button onClick={() => setChartTimespan('week')} className={`px-3 py-1 text-sm rounded ${chartTimespan === 'week' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}>Tydzień</button>
                  <button onClick={() => setChartTimespan('month')} className={`px-3 py-1 text-sm rounded ${chartTimespan === 'month' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}>Miesiąc</button>
              </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  borderColor: '#475569'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="kebabów" stroke="#d97706" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Statistics;