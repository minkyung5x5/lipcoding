'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { isAuthenticated, getUserFromToken } from '@/lib/auth';
import { UserInfo, MatchRequestCreate } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';

export default function MentorsPage() {
  const router = useRouter();
  const [mentors, setMentors] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchSkill, setSearchSkill] = useState('');
  const [orderBy, setOrderBy] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [requestingMentorId, setRequestingMentorId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    const user = getUserFromToken();
    if (user?.role !== 'mentee') {
      toast.error('멘티만 접근할 수 있습니다.');
      router.push('/profile');
      return;
    }
    
    setCurrentUser(user);
    fetchMentors();
  }, [router]);

  const fetchMentors = async (skill?: string, order?: string) => {
    try {
      const params = new URLSearchParams();
      if (skill) params.append('skill', skill);
      if (order) params.append('order_by', order);
      
      const response = await api.get(`/mentors?${params.toString()}`);
      setMentors(response.data);
    } catch (error) {
      toast.error('멘토 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const sendMatchRequest = async (mentorId: number) => {
    const message = prompt('멘토에게 보낼 메시지를 입력하세요:');
    if (!message || !message.trim()) {
      toast.error('메시지를 입력해주세요.');
      return;
    }

    setRequestingMentorId(mentorId);
    try {
      const requestData: MatchRequestCreate = {
        mentorId,
        menteeId: currentUser.user_id,
        message: message.trim()
      };
      
      await api.post('/match-requests', requestData);
      toast.success('매칭 요청을 성공적으로 보냈습니다!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || '매칭 요청에 실패했습니다.';
      toast.error(errorMessage);
    } finally {
      setRequestingMentorId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner message="멘토 목록을 불러오는 중..." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">멘토 찾기</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            전문 분야의 멘토들과 연결되어 성장의 기회를 잡아보세요
          </p>
        </div>
      
        {/* 검색 및 필터 */}
        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                기술 스택으로 검색
              </label>
              <input
                type="text"
                value={searchSkill}
                onChange={(e) => setSearchSkill(e.target.value)}
                placeholder="예: React, Python, JavaScript"
                className="input-field w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                정렬 기준
              </label>
              <select
                value={orderBy}
                onChange={(e) => setOrderBy(e.target.value)}
                className="input-field w-full px-4 py-3 rounded-lg text-gray-900"
              >
                <option value="">기본 정렬</option>
                <option value="name">이름순</option>
                <option value="skill">기술 스택순</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => fetchMentors(searchSkill, orderBy)}
                className="btn-primary w-full py-3 px-6 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                검색
              </button>
            </div>
          </div>
        </div>

        {/* 멘토 목록 */}
        {mentors.length === 0 ? (
          <EmptyState
            icon="👨‍🏫"
            title="멘토를 찾을 수 없습니다"
            description="다른 검색 조건을 시도해보세요."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mentors.map((mentor) => (
              <div key={mentor.id} className="card p-6 hover:shadow-xl transition-all duration-300">
                <div className="text-center mb-6">
                  <div className="relative">
                    <img
                      src={mentor.profile.imageUrl || '/api/placeholder/120/120'}
                      alt={mentor.profile.name}
                      className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-4 border-gray-100 shadow-md"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/120x120/e5e7eb/6b7280?text=' + encodeURIComponent(mentor.profile.name.charAt(0));
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{mentor.profile.name}</h3>
                  <p className="text-blue-600 font-medium text-sm">멘토</p>
                </div>

                {mentor.profile.bio && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">소개</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{mentor.profile.bio}</p>
                  </div>
                )}

                {mentor.profile.skills && mentor.profile.skills.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">기술 스택</h4>
                    <div className="flex flex-wrap gap-2">
                      {mentor.profile.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => sendMatchRequest(mentor.id)}
                  disabled={requestingMentorId === mentor.id}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {requestingMentorId === mentor.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      요청 중...
                    </div>
                  ) : (
                    '멘토링 요청하기'
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
