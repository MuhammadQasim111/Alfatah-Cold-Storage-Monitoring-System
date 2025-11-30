import React from 'react';

export interface Alert {
  alert_id?: number; // Optional as it might be a live MQTT alert without ID yet
  unit_id: number;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  ts: string;
  resolved: boolean;
}

interface AlertsPanelProps {
  alerts: Alert[];
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts }) => {
  // Ensure alerts is always an array
  const safeAlerts = Array.isArray(alerts) ? alerts : [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden h-[400px] flex flex-col">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h2 className="font-bold text-slate-700">System Alerts</h2>
        <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
          {safeAlerts.filter(a => !a.resolved).length} Active
        </span>
      </div>

      <div className="overflow-y-auto flex-1 p-0">
        {safeAlerts.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No active alerts. System healthy.</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs sticky top-0">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {safeAlerts.map((alert, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {new Date(alert.ts).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3 font-medium">Unit {alert.unit_id}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase
                      ${alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        alert.severity === 'warning' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}
                    `}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{alert.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;
