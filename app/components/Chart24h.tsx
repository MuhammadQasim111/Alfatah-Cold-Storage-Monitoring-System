import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface Reading {
  ts: string;
  temperature: number;
  humidity: number;
}

interface Chart24hProps {
  unitId: number;
  data: Reading[];
  unitName: string;
}

const Chart24h: React.FC<Chart24hProps> = ({ unitId, data, unitName }) => {
  // Sort data by timestamp ascending for chart
  const sortedData = [...data].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  const chartData = {
    labels: sortedData.map(d => new Date(d.ts)),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: sortedData.map(d => d.temperature),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        yAxisID: 'y',
        tension: 0.3,
        pointRadius: 2,
      },
      {
        label: 'Humidity (%)',
        data: sortedData.map(d => d.humidity),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        yAxisID: 'y1',
        tension: 0.3,
        pointRadius: 2,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    stacked: false,
    plugins: {
      title: {
        display: true,
        text: `${unitName} - 24 Hour History`,
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'hour',
          displayFormats: {
            hour: 'HH:mm'
          }
        },
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: { display: true, text: 'Temp (°C)' },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        title: { display: true, text: 'Humidity (%)' },
      },
    },
  };

  return (
    <div className="h-[400px] w-full bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <Line options={options} data={chartData} />
    </div>
  );
};

export default Chart24h;
