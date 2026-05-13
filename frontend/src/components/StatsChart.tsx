'use client';

import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, Filler,
);

interface DailyStat {
  day: string;
  increments: number;
  decrements: number;
  total_actions: number;
}

interface Props {
  daily: DailyStat[];
  dark: boolean;
}

export default function StatsChart({ daily, dark }: Props) {
  if (!daily.length) {
    return (
      <div className="flex items-center justify-center py-10 text-sm" style={{ color: 'var(--muted)' }}>
        No activity data yet. Start using the counter!
      </div>
    );
  }

  const labels = daily.map(d =>
    new Date(d.day + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  );

  const gridColor  = dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)';
  const textColor  = dark ? '#64748b' : '#94a3b8';

  const data = {
    labels,
    datasets: [
      {
        label: 'Increments',
        data: daily.map(d => d.increments),
        backgroundColor: 'rgba(16,185,129,.75)',
        borderColor:     'rgba(16,185,129,1)',
        borderWidth: 1.5,
        borderRadius: 6,
      },
      {
        label: 'Decrements',
        data: daily.map(d => d.decrements),
        backgroundColor: 'rgba(239,68,68,.75)',
        borderColor:     'rgba(239,68,68,1)',
        borderWidth: 1.5,
        borderRadius: 6,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: textColor,
          font: { size: 11, family: 'Inter' },
          boxWidth: 10,
          boxHeight: 10,
          borderRadius: 3,
        },
      },
      tooltip: {
        backgroundColor: dark ? '#1a1a2e' : '#fff',
        titleColor: dark ? '#e2e8f0' : '#0f172a',
        bodyColor:  dark ? '#94a3b8' : '#64748b',
        borderColor: dark ? '#2d2d44' : '#e2e8f0',
        borderWidth: 1,
        cornerRadius: 10,
        padding: 10,
      },
    },
    scales: {
      x: {
        grid:  { color: gridColor },
        ticks: { color: textColor, font: { size: 10 } },
      },
      y: {
        grid:       { color: gridColor },
        ticks:      { color: textColor, font: { size: 10 }, precision: 0 },
        beginAtZero: true,
      },
    },
  };

  return <Bar data={data} options={options} />;
}
