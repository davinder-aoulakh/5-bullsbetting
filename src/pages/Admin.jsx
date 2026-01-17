import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Shield, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Eye,
  Filter
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const userData = await base44.auth.me();
      if (userData.role !== 'admin') {
        navigate(createPageUrl('Home'));
        return;
      }
      setUser(userData);
    } catch (e) {
      navigate(createPageUrl('Home'));
    }
    setLoading(false);
  };

  const { data: verificationLogs = [], refetch } = useQuery({
    queryKey: ['verification-logs'],
    queryFn: () => base44.entities.VerificationLog.list('-created_date', 100),
    enabled: !loading && user !== null,
    initialData: []
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !loading && user !== null,
    initialData: []
  });

  const getUserById = (userId) => {
    return users.find(u => u.id === userId);
  };

  const filteredLogs = verificationLogs.filter(log => {
    const logUser = getUserById(log.user_id);
    const matchesSearch = !searchQuery || 
      logUser?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      logUser?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.reference_id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || log.verification_type === filterType;
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'pending': return <Clock className="w-4 h-4 text-amber-400" />;
      case 'manual_review': return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      passed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30',
      pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      initiated: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      manual_review: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      error: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return (
      <Badge className={styles[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}>
        {status}
      </Badge>
    );
  };

  const getTypeLabel = (type) => {
    const labels = {
      cpf_validation: 'CPF Validation',
      id_document: 'ID Document',
      facial_recognition: 'Facial Recognition',
      kyc_screening: 'KYC Screening',
      self_exclusion_check: 'Self Exclusion',
      pep_check: 'PEP Check',
      sanctions_check: 'Sanctions Check'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const stats = {
    total: verificationLogs.length,
    passed: verificationLogs.filter(l => l.status === 'passed').length,
    failed: verificationLogs.filter(l => l.status === 'failed').length,
    pending: verificationLogs.filter(l => l.status === 'pending' || l.status === 'initiated').length,
    manual_review: verificationLogs.filter(l => l.status === 'manual_review').length
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-white/50">Verification Logs & KYC Management</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-white/50 text-sm mb-1">Total</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </Card>
          <Card className="bg-emerald-500/10 border-emerald-500/20 p-4">
            <p className="text-emerald-400/70 text-sm mb-1">Passed</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.passed}</p>
          </Card>
          <Card className="bg-red-500/10 border-red-500/20 p-4">
            <p className="text-red-400/70 text-sm mb-1">Failed</p>
            <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
          </Card>
          <Card className="bg-amber-500/10 border-amber-500/20 p-4">
            <p className="text-amber-400/70 text-sm mb-1">Pending</p>
            <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
          </Card>
          <Card className="bg-orange-500/10 border-orange-500/20 p-4">
            <p className="text-orange-400/70 text-sm mb-1">Review</p>
            <p className="text-2xl font-bold text-orange-400">{stats.manual_review}</p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/5 border-white/10 p-4 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                type="text"
                placeholder="Search by user email, name, or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-10 px-3 rounded-md bg-white/5 border border-white/10 text-white"
            >
              <option value="all">All Types</option>
              <option value="cpf_validation">CPF Validation</option>
              <option value="id_document">ID Document</option>
              <option value="facial_recognition">Facial Recognition</option>
              <option value="kyc_screening">KYC Screening</option>
              <option value="self_exclusion_check">Self Exclusion</option>
              <option value="pep_check">PEP Check</option>
              <option value="sanctions_check">Sanctions Check</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-10 px-3 rounded-md bg-white/5 border border-white/10 text-white"
            >
              <option value="all">All Statuses</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="initiated">Initiated</option>
              <option value="manual_review">Manual Review</option>
              <option value="error">Error</option>
            </select>
          </div>
        </Card>

        {/* Logs Table */}
        <Card className="bg-white/5 border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase">Provider</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.map((log) => {
                  const logUser = getUserById(log.user_id);
                  return (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-sm text-white/70">
                        {new Date(log.created_date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-white font-medium">
                            {logUser?.full_name || log.user_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-white/50">
                            {logUser?.email || log.user_email || log.user_id}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-white">
                        {getTypeLabel(log.verification_type)}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70 uppercase">
                        {log.provider}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(log.status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/50 font-mono">
                        {log.reference_id || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedLog(log)}
                          className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <Filter className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/50">No verification logs found</p>
            </div>
          )}
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && getStatusIcon(selectedLog.status)}
              Verification Log Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/50 text-sm mb-1">User</p>
                  <p className="text-white font-medium">
                    {getUserById(selectedLog.user_id)?.full_name || selectedLog.user_name || 'Unknown'}
                  </p>
                  <p className="text-white/50 text-xs">
                    {getUserById(selectedLog.user_id)?.email || selectedLog.user_email || selectedLog.user_id}
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-sm mb-1">Status</p>
                  {getStatusBadge(selectedLog.status)}
                </div>
                <div>
                  <p className="text-white/50 text-sm mb-1">Type</p>
                  <p className="text-white">{getTypeLabel(selectedLog.verification_type)}</p>
                </div>
                <div>
                  <p className="text-white/50 text-sm mb-1">Provider</p>
                  <p className="text-white uppercase">{selectedLog.provider}</p>
                </div>
                <div>
                  <p className="text-white/50 text-sm mb-1">Reference ID</p>
                  <p className="text-white font-mono text-sm">{selectedLog.reference_id || '-'}</p>
                </div>
                <div>
                  <p className="text-white/50 text-sm mb-1">Date</p>
                  <p className="text-white text-sm">
                    {new Date(selectedLog.created_date).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              {selectedLog.result_details && (
                <div>
                  <p className="text-white/50 text-sm mb-2">Result Details</p>
                  <Card className="bg-white/5 border-white/10 p-4">
                    <pre className="text-xs text-white/70 overflow-auto">
                      {JSON.stringify(selectedLog.result_details, null, 2)}
                    </pre>
                  </Card>
                </div>
              )}

              {selectedLog.ip_address && (
                <div>
                  <p className="text-white/50 text-sm mb-1">IP Address</p>
                  <p className="text-white font-mono text-sm">{selectedLog.ip_address}</p>
                </div>
              )}

              {selectedLog.device_info && (
                <div>
                  <p className="text-white/50 text-sm mb-1">Device Info</p>
                  <p className="text-white text-sm">{selectedLog.device_info}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}