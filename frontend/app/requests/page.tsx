'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { isAuthenticated, getUserFromToken } from '@/lib/auth';
import { MatchRequestInfo } from '@/types';

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
    if (!confirm('정말로 요청을 취소하시겠습니까?')) return;
    
    setActionLoading(requestId);
    try {
      await api.delete(`/match-requests/${requestId}`);
      toast.success('요청을 취소했습니다.');
      fetchRequests(currentUser);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || '요청 취소에 실패했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'accepted': return '수락됨';
      case 'rejected': return '거절됨';
      case 'cancelled': return '취소됨';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'accepted':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'rejected':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'cancelled':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">요청 목록을 불러오는 중...</p>
        </div>
      </div>
    );
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
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-3xl">📝</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {currentUser?.role === 'mentor' ? '받은 요청이 없습니다' : '보낸 요청이 없습니다'}
            </h3>
            <p className="text-gray-600 mb-6">
              {currentUser?.role === 'mentor' 
                ? '멘티들로부터 요청이 오면 여기에 표시됩니다.' 
                : '멘토에게 요청을 보내보세요.'}
            </p>
            {currentUser?.role === 'mentee' && (
              <button
                onClick={() => router.push('/mentors')}
                className="btn-primary px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                멘토 찾아보기
              </button>
            )}
          </div>
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
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{getStatusText(request.status)}</span>
                      </span>
                    </div>
                    
                    {request.message && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">메시지</h4>
                        <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{request.message}</p>
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
