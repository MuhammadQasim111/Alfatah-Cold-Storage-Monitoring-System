import React from 'react';

interface LiveCardProps {
  unitId: number;
  name: string;
  type: string;
  temperature: number | null;
  humidity: number | null;
  lastUpdated: string | null;
  status: 'OK' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
  onClick: () => void;
  isSelected: boolean;
}

const LiveCard: React.FC<LiveCardProps> = ({
  name, type, temperature, humidity, lastUpdated, status, onClick, isSelected
}) => {

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'OK': return 'bg-green-100 text-green-800 border-green-200';
      case 'WARNING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-xl border-2 transition-all cursor-pointer shadow-sm hover:shadow-md
        ${isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-100 bg-white'}
      `}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg text-slate-800">{name}</h3>
          <p className="text-sm text-slate-500">{type}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(status)}`}>
          {status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 p-3 rounded-lg">
          <p className="text-xs text-slate-500 uppercase">Temp</p>
          <p className={`text-2xl font-mono font-semibold ${(temperature || 0) > 10 ? 'text-red-600' : 'text-slate-700'
            }`}>
            {typeof temperature === 'number' && !isNaN(temperature) ? `${temperature.toFixed(1)}°C` : '--'}
          </p>
        </div>
        <div className="bg-slate-50 p-3 rounded-lg">
          <p className="text-xs text-slate-500 uppercase">Humidity</p>
          <p className="text-2xl font-mono font-semibold text-blue-600">
            {typeof humidity === 'number' && !isNaN(humidity) ? `${humidity.toFixed(1)}%` : '--'}
          </p>
        </div>
      </div>

      <div className="mt-4 text-right">
        <p className="text-xs text-slate-400">
          Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}
        </p>
      </div>
    </div>
  );
};

export default LiveCard;
