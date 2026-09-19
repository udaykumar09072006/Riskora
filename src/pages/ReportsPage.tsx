import React, { useState, useEffect } from 'react';
import { reportApi } from '../services/api';
import { ReportData } from '../types/fraud';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp, 
  ShieldAlert, 
  Cpu, 
  Globe2, 
  Smartphone, 
  CheckCircle2, 
  Filter,
  ArrowUpRight,
  Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

export const ReportsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    reportApi.getReports(timeRange)
      .then(res => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(err => {
        console.warn('Reports load error:', err);
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [timeRange]);

  const handleExportCsv = () => {
    window.location.href = reportApi.getExportCsvUrl();
  };

  const COLORS = ['#10b981', '#f59e0b', '#f43f5e', '#dc2626'];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 rounded-full bg-red-600 animate-pulse" />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Fraud SOC Intelligence & Audit Reports
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Macro fraud trends, agent latency benchmarks, channel distribution, and syndicate attribution.
          </p>
        </div>

        {/* Date Range & Export Actions */}
        <div className="flex items-center gap-3">
          {/* Time range selector */}
          <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 text-xs">
            {(['7d', '30d', '90d', '1y'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg font-mono font-medium transition-all ${
                  timeRange === range
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold transition-all shadow-xs active:scale-98 cursor-pointer"
          >
            <Download className="h-4 w-4 text-red-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center space-y-3">
          <div className="h-8 w-8 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin" />
          <span className="text-xs font-mono text-slate-400">Synthesizing SOC Intelligence Reports...</span>
        </div>
      ) : (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-white/10 bg-[#0d0d0d] space-y-1">
              <span className="text-[11px] font-mono uppercase text-slate-400">Total Blocked Fraud</span>
              <div className="text-2xl font-black text-white font-mono">$142,850.00</div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                <TrendingUp className="h-3 w-3" /> +14.2% prevented vs prior window
              </div>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-[#0d0d0d] space-y-1">
              <span className="text-[11px] font-mono uppercase text-slate-400">Interception Precision</span>
              <div className="text-2xl font-black text-emerald-400 font-mono">98.4%</div>
              <div className="text-[11px] text-slate-400 font-mono">False positive rate: &lt; 0.4%</div>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-[#0d0d0d] space-y-1">
              <span className="text-[11px] font-mono uppercase text-slate-400">Avg SOC Investigation Time</span>
              <div className="text-2xl font-black text-amber-400 font-mono">1.2 mins</div>
              <div className="text-[11px] text-slate-400 font-mono">Autonomous agent resolution: 88%</div>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-[#0d0d0d] space-y-1">
              <span className="text-[11px] font-mono uppercase text-slate-400">Active Syndicate Clusters</span>
              <div className="text-2xl font-black text-red-500 font-mono">2 Rings</div>
              <div className="text-[11px] text-red-400 font-mono">23 Linked identity nodes</div>
            </div>
          </div>

          {/* Section 1: Charts (Trend Area & Volume by Channel) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Trend Area Chart */}
            <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="font-bold text-white text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-red-500" />
                  Fraud Attack Volume vs Prevented Capital
                </span>
                <span className="text-[10px] font-mono text-slate-400">DAILY AGGREGATION</span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.fraudTrend || []}>
                    <defs>
                      <linearGradient id="blockedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="normalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="date" stroke="#666" fontSize={10} />
                    <YAxis stroke="#666" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="blockedAmount" name="Blocked ($)" stroke="#dc2626" strokeWidth={2} fillOpacity={1} fill="url(#blockedGrad)" />
                    <Area type="monotone" dataKey="flaggedVolume" name="Flagged Txs" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#normalGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Risk Distribution Donut */}
            <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="font-bold text-white text-sm flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  Risk Distribution
                </span>
                <span className="text-[10px] font-mono text-slate-400">PROPORTIONS</span>
              </div>

              <div className="h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.riskDistribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="count"
                    >
                      {(data?.riskDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 pt-2 text-xs font-mono">
                {(data?.riskDistribution || []).map((item, idx) => (
                  <div key={item.level} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      {item.level}
                    </span>
                    <span className="text-slate-400">{item.count} ({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Agent Performance Benchmarks */}
          <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <Cpu className="h-4 w-4 text-red-500" />
                8-Agent Neural Execution & Latency Telemetry
              </span>
              <span className="text-[10px] font-mono text-slate-400">SUB-MILLISECOND BENCHMARKS</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 font-mono text-[10px] uppercase">
                    <th className="py-2.5 px-3">Agent Name</th>
                    <th className="py-2.5 px-3">Accuracy</th>
                    <th className="py-2.5 px-3">Avg Latency</th>
                    <th className="py-2.5 px-3">Executions</th>
                    <th className="py-2.5 px-3">Operational Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                  {(data?.agentPerformance || []).map((agent, i) => (
                    <tr key={agent.agent} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 font-sans font-semibold text-white flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        {agent.agent}
                      </td>
                      <td className="py-3 px-3 text-emerald-400 font-bold">{agent.accuracy}%</td>
                      <td className="py-3 px-3 text-slate-300">{agent.avgLatencyMs} ms</td>
                      <td className="py-3 px-3 text-slate-400">{agent.executions.toLocaleString()}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          HEALTHY
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: High Risk Locations & Devices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Locations */}
            <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 space-y-3">
              <span className="font-bold text-white text-sm flex items-center gap-2 pb-2 border-b border-white/10">
                <Globe2 className="h-4 w-4 text-sky-400" />
                Top High-Risk Geolocation Origins
              </span>
              <div className="space-y-2 text-xs">
                {(data?.highRiskLocations || []).map(loc => (
                  <div key={loc.city} className="flex items-center justify-between p-2 rounded-lg bg-white/5 font-mono">
                    <span className="text-white font-medium">{loc.city}, {loc.country}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-red-400 font-bold">{loc.fraudCount} attacks</span>
                      <span className="text-slate-400">${loc.amount.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Devices */}
            <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 space-y-3">
              <span className="font-bold text-white text-sm flex items-center gap-2 pb-2 border-b border-white/10">
                <Smartphone className="h-4 w-4 text-purple-400" />
                High-Risk Device & Fingerprint Signatures
              </span>
              <div className="space-y-2 text-xs">
                {(data?.highRiskDevices || []).map(dev => (
                  <div key={dev.deviceType} className="flex items-center justify-between p-2 rounded-lg bg-white/5 font-mono">
                    <div>
                      <div className="text-white font-medium">{dev.deviceType}</div>
                      <div className="text-[10px] text-slate-500">{dev.os}</div>
                    </div>
                    <span className="text-red-400 font-bold">{dev.fraudCount} flagged</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
