'use client';

import React, { useState, useEffect, useCallback } from 'react';
import LiveCard from './components/LiveCard';
import Chart24h from './components/Chart24h';
import AlertsPanel, { Alert } from './components/AlertsPanel';
import { connectToBroker } from './mqtt-client';

interface Unit {
  unit_id: number;
  name: string;
  product_type: string;
  location: string;
}

interface Reading {
  unit_id: number;
  temperature: number;
  humidity: number;
  ts: string;
}

export default function Dashboard() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<number>(1);
  const [liveReadings, setLiveReadings] = useState<Record<number, Reading>>({});
  const [historyData, setHistoryData] = useState<Reading[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [mode, setMode] = useState<'realtime' | 'historical'>('realtime');
  const [loadingHistory, setLoadingHistory] = useState(false);

  // 1. Fetch Metadata (Units)
  useEffect(() => {
    fetch('/api/storage-units')
      .then(res => res.json())
      .then(data => setUnits(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Failed to fetch units:', err);
        setUnits([]);
      });

    // Initial Alerts Fetch
    fetch('/api/alerts')
      .then(res => res.json())
      .then(data => setAlerts(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Failed to fetch alerts:', err);
        setAlerts([]);
      });

    // Initial Latest Readings (to fill cards before MQTT kicks in)
    fetch('/api/readings/latest')
      .then(res => res.json())
      .then((data: any[]) => {
        const map: Record<number, Reading> = {};
        data.forEach(r => map[r.unit_id] = r);
        setLiveReadings(map);
      })
      .catch(console.error);
  }, []);

  // 2. MQTT Connection for Real-time Updates
  useEffect(() => {
    const client = connectToBroker();

    client.subscribe('coldstorage/+/readings');
    client.subscribe('coldstorage/alerts');

    client.on('message', (topic, message) => {
      const payload = JSON.parse(message.toString());

      if (topic.includes('/readings')) {
        setLiveReadings(prev => ({
          ...prev,
          [payload.unit_id]: {
            unit_id: payload.unit_id,
            temperature: payload.temperature,
            humidity: payload.humidity,
            ts: payload.timestamp || payload.ts || new Date().toISOString()
          }
        }));
      } else if (topic === 'coldstorage/alerts') {
        // Prepend new alert
        setAlerts(prev => [payload, ...prev]);
      }
    });

    return () => {
      client.end();
    };
  }, []);

  // 3. Fetch History when selection changes
  const fetchHistory = useCallback(async (unitId: number) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/readings/history?unit_id=${unitId}&hours=24`);
      const data = await res.json();
      setHistoryData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(selectedUnitId);
  }, [selectedUnitId, fetchHistory]);

  // Determine Status based on simple logic (mirroring backend for UI responsiveness)
  const getStatus = (unitId: number, temp: number | undefined): 'OK' | 'WARNING' | 'CRITICAL' | 'OFFLINE' => {
    if (temp === undefined) return 'OFFLINE';
    // Simplified logic for UI demo - assumes backend is authority on alerts
    // We check if there's a recent critical alert for this unit
    const recentAlert = alerts.find(a => a.unit_id === unitId && !a.resolved);
    if (recentAlert?.severity === 'critical') return 'CRITICAL';
    if (recentAlert?.severity === 'warning') return 'WARNING';
    return 'OK';
  };

  const selectedUnit = units.find(u => u.unit_id === selectedUnitId);

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Cold Storage Monitor</h1>
          <p className="text-slate-500">Real-time Environmental Tracking System</p>
        </div>
        <div className="flex gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setMode('realtime')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${mode === 'realtime' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
            >
              Real-time
            </button>
            <button
              onClick={() => setMode('historical')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${mode === 'historical' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
            >
              Historical
            </button>
          </div>
        </div>
      </header>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {units.map(unit => {
          const reading = liveReadings[unit.unit_id];
          return (
            <LiveCard
              key={unit.unit_id}
              unitId={unit.unit_id}
              name={unit.name}
              type={unit.product_type}
              temperature={reading?.temperature ?? null}
              humidity={reading?.humidity ?? null}
              lastUpdated={reading?.ts ?? null}
              status={getStatus(unit.unit_id, reading?.temperature)}
              isSelected={selectedUnitId === unit.unit_id}
              onClick={() => setSelectedUnitId(unit.unit_id)}
            />
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 space-y-4">
          {selectedUnit && (
            <Chart24h
              unitId={selectedUnitId}
              unitName={selectedUnit.name}
              data={mode === 'realtime' ? [...historyData, liveReadings[selectedUnitId]].filter(Boolean) : historyData}
            />
          )}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
            <strong>Simulation Info:</strong> To see live data, run the Python scripts provided in the repository.
            <ul className="list-disc ml-5 mt-2">
              <li><code>python scripts/mqtt_publisher.py</code> (Updates MQTT/Live Cards)</li>
              <li><code>python scripts/http_logger.py</code> (Updates Database/History)</li>
            </ul>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="lg:col-span-1">
          <AlertsPanel alerts={alerts} />
        </div>
      </div>
    </main>
  );
}
