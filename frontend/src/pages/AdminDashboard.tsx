import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Shield, AlertTriangle, Hammer, CheckCircle, Loader2, RefreshCcw } from 'lucide-react';

interface Stats {
  onlineCount: number;
  totalUsers: number;
  activeChats: number;
  pendingReports: number;
  totalMatches: number;
}

interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  chatRoomId: string;
  reason: string;
  status: string;
  createdAt: string;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);


  const [banUserId, setBanUserId] = useState('');
  const [banReason, setBanReason] = useState('Violating platform policies');
  const [banDuration, setBanDuration] = useState(24);
  const [banSuccess, setBanSuccess] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, reportsRes] = await Promise.all([
        api.get<Stats>('/admin/stats'),
        api.get<{ content: Report[] }>('/admin/reports?size=10')
      ]);
      setStats(statsRes.data);
      setReports(reportsRes.data.content || []);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleResolveReport = async (reportId: string, status: 'REVIEWED' | 'DISMISSED') => {
    setActionLoading(reportId);
    try {
      await api.put(`/admin/reports/${reportId}`, { status });

      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));

      const statsRes = await api.get<Stats>('/admin/stats');
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to update report:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDirectBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banUserId.trim()) return;

    setActionLoading('direct-ban');
    try {
      await api.post('/admin/bans', {
        userId: banUserId.trim(),
        reason: banReason,
        durationHours: banDuration
      });
      setBanSuccess(true);
      setBanUserId('');
      setTimeout(() => setBanSuccess(false), 3000);
      const statsRes = await api.get<Stats>('/admin/stats');
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to ban user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
        <p className="text-gray-400">Loading admin operations panel...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 py-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-white">Admin Dashboard</h2>
            <p className="text-sm text-gray-400">EchoTalk core moderation and service stats</p>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white flex items-center gap-2 text-sm font-semibold transition-all cursor-pointer"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Card 1 */}
        <div className="p-5 rounded-3xl glass border border-white/5">
          <span className="text-gray-400 text-xs font-semibold block uppercase mb-1">Online Users</span>
          <span className="text-2xl font-black text-white">{stats?.onlineCount || 0}</span>
          <div className="w-full bg-emerald-500/10 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full w-[45%]" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-3xl glass border border-white/5">
          <span className="text-gray-400 text-xs font-semibold block uppercase mb-1">Total Users</span>
          <span className="text-2xl font-black text-white">{stats?.totalUsers || 0}</span>
          <div className="w-full bg-accent/10 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-accent h-full w-[70%]" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-5 rounded-3xl glass border border-white/5">
          <span className="text-gray-400 text-xs font-semibold block uppercase mb-1">Active Chats</span>
          <span className="text-2xl font-black text-white">{stats?.activeChats || 0}</span>
          <div className="w-full bg-[#d946ef]/10 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-[#d946ef] h-full w-[35%]" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-5 rounded-3xl glass border border-white/5">
          <span className="text-gray-400 text-xs font-semibold block uppercase mb-1">Pending Reports</span>
          <span className="text-2xl font-black text-rose-400">{stats?.pendingReports || 0}</span>
          <div className="w-full bg-rose-500/15 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-rose-500 h-full w-[80%] animate-pulse" />
          </div>
        </div>

        {/* Card 5 */}
        <div className="p-5 rounded-3xl glass border border-white/5">
          <span className="text-gray-400 text-xs font-semibold block uppercase mb-1">Total Matches</span>
          <span className="text-2xl font-black text-white">{stats?.totalMatches || 0}</span>
          <div className="w-full bg-indigo-500/10 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-indigo-500 h-full w-[60%]" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* List of Reports Table (Left) */}
        <div className="lg:col-span-2 bg-[#101118]/80 border border-white/5 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <h3 className="text-white font-bold text-base">Flagged User Reports</h3>
          </div>

          {reports.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-10">No recent reports found. The platform is clean!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs font-semibold border-b border-white/5">
                    <th className="py-2.5">Reported User ID</th>
                    <th className="py-2.5">Reason</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {reports.map((report) => (
                    <tr key={report.id} className="text-gray-300">
                      <td className="py-3.5 font-mono text-xs text-gray-400">{report.reportedId}</td>
                      <td className="py-3.5">{report.reason}</td>
                      <td className="py-3.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${report.status === 'PENDING'
                            ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                            : report.status === 'REVIEWED'
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                              : 'bg-white/5 border border-white/5 text-gray-500'
                          }`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        {report.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleResolveReport(report.id, 'REVIEWED')}
                              disabled={actionLoading === report.id}
                              className="px-2.5 py-1 text-xs rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all cursor-pointer"
                              title="Mark Reviewed"
                            >
                              Resolve
                            </button>
                            <button
                              onClick={() => handleResolveReport(report.id, 'DISMISSED')}
                              disabled={actionLoading === report.id}
                              className="px-2.5 py-1 text-xs rounded-lg bg-white/5 text-gray-400 hover:text-white border border-white/10 transition-all cursor-pointer"
                              title="Dismiss Report"
                            >
                              Dismiss
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Moderation Controls (Right) */}
        <div className="bg-[#101118]/80 border border-white/5 rounded-3xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Hammer className="w-5 h-5 text-accent" />
            <h3 className="text-white font-bold text-base">Direct Moderation Ban</h3>
          </div>

          <form onSubmit={handleDirectBan} className="space-y-4">
            {banSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>User banned successfully!</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Target User UUID</label>
              <input
                type="text"
                value={banUserId}
                onChange={(e) => setBanUserId(e.target.value)}
                placeholder="Paste User UUID"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-accent text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Reason</label>
              <select
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full px-4 py-3 bg-[#101118] border border-white/10 rounded-2xl text-white focus:outline-none focus:border-accent text-sm"
              >
                <option value="Violating platform policies">Violating platform policies</option>
                <option value="Hate speech / Harassment">Hate speech / Harassment</option>
                <option value="Pornography / Inappropriate stream">Pornography / Inappropriate stream</option>
                <option value="Advertising / Spam / Bots">Advertising / Spam / Bots</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ban Duration (Hours)</label>
              <div className="grid grid-cols-3 gap-2">
                {[24, 72, 168].map((hours) => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setBanDuration(hours)}
                    className={`py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${banDuration === hours
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-400 font-bold'
                        : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                      }`}
                  >
                    {hours === 168 ? '1 Week' : `${hours}h`}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={actionLoading === 'direct-ban'}
              className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:bg-rose-600/35 text-white font-bold shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer text-sm"
            >
              {actionLoading === 'direct-ban' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Hammer className="w-4 h-4" />
                  <span>Execute Platform Ban</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
