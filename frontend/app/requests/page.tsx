'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { isAuthenticated, getUserFromToken } from '@/lib/auth';
import { MatchRequestInfo } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';

export default function RequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<MatchRequestInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    const user = getUserFromToken();
    setCurrentUser(user);
    fetchRequests(user);
  }, [router]);

  const fetchRequests = async (user: any) => {
    try {
      const endpoint = user.role === 'mentor' ? '/match-requests/incoming' : '/match-requests/outgoing';
      const response = await api.get(endpoint);
      setRequests(response.data);
    } catch (error) {
      toast.error('요청 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: number) => {
    setActionLoading(requestId);
    try {
      await api.put(`/match-requests/${requestId}/accept`);
      toast.success('요청을 수락했습니다!');
      fetchRequests(currentUser);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || '요청 수락에 실패했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: number) => {
    setActionLoading(requestId);
    try {
      await api.put(`/match-requests/${requestId}/reject`);
      toast.success('요청을 거절했습니다.');
      fetchRequests(currentUser);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || '요청 거절에 실패했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (requestId: number) => {
    const confirmMessage = '정말로 요청을 취소하시겠습니까?\n취소된 요청은 복구할 수 없습니다.';
    if (!confirm(confirmMessage)) return;
    
    setActionLoading(requestId);
    try {
      await api.delete(`/match-requests/${requestId}`);
      toast.success('요청을 취소했습니다.');
      fetchRequests(currentUser);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || '요청 취소에 실패했습니다.';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  if (loading) {
    return <LoadingSpinner message="요청 목록을 불러오는 중..." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {currentUser?.role === 'mentor' ? '멘토링 요청 관리' : '내 멘토링 요청'}
          </h1>
          <p className="text-gray-600">
            {currentUser?.role === 'mentor' 
              ? '받은 멘토링 요청을 확인하고 관리하세요' 
              : '보낸 멘토링 요청의 상태를 확인하세요'}
          </p>
        </div>

        {/* 요청 목록 */}
        {requests.length === 0 ? (
          <EmptyState
            icon="📝"
            title={currentUser?.role === 'mentor' ? '받은 요청이 없습니다' : '보낸 요청이 없습니다'}
            description={currentUser?.role === 'mentor' 
              ? '멘티들로부터 요청이 오면 여기에 표시됩니다.' 
              : '멘토에게 요청을 보내보세요.'}
            actionButton={currentUser?.role === 'mentee' ? {
              text: '멘토 찾아보기',
              onClick: () => router.push('/mentors')
            } : undefined}
          />
        ) : (
          <div className="space-y-6">
            {requests.map((request) => (
              <div key={request.id} className="card p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {currentUser?.role === 'mentor' 
                          ? `멘티 ID: ${request.menteeId}` 
                          : `멘토 ID: ${request.mentorId}`}
                      </h3>
                      <StatusBadge status={request.status} />
                    </div>

                    {request.createdAt && (
                      <p className="text-sm text-gray-500 mb-3">
                        요청일: {formatDate(request.createdAt)}
                      </p>
                    )}
                    
                    {request.message && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">메시지</h4>
                        <p className="text-gray-600 bg-gray-50 p-3 rounded-lg border-l-4 border-blue-200">{request.message}</p>
                      </div>
                    )}
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex space-x-2 ml-4">
                    {currentUser?.role === 'mentor' && request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAccept(request.id)}
                          disabled={actionLoading === request.id}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          {actionLoading === request.id ? '처리중...' : '수락'}
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={actionLoading === request.id}
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          {actionLoading === request.id ? '처리중...' : '거절'}
                        </button>
                      </>
                    )}
                    
                    {currentUser?.role === 'mentee' && request.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(request.id)}
                        disabled={actionLoading === request.id}
                        className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        {actionLoading === request.id ? '처리중...' : '취소'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
