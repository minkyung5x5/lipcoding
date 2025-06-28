'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { isAuthenticated, getUserFromToken } from '@/lib/auth';
import { ProfileUpdateRequest, UserInfo } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserInfo | null>(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ProfileUpdateRequest>();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    const user = getUserFromToken();
    setCurrentUser(user);
    fetchProfile();
  }, [router]);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile');
      const profileData = response.data;
      setProfile(profileData);
      
      // 폼에 기존 데이터 설정
      setValue('name', profileData.profile.name || '');
      setValue('bio', profileData.profile.bio || '');
      setValue('skills', profileData.profile.skills || []);
    } catch (error) {
      toast.error('프로필을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProfileUpdateRequest) => {
    setUpdating(true);
    try {
      await api.put('/profile', data);
      toast.success('프로필이 성공적으로 업데이트되었습니다!');
      fetchProfile(); // 업데이트된 프로필 다시 가져오기
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || '프로필 업데이트에 실패했습니다.';
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const skillsString = e.target.value;
    const skillsArray = skillsString.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
    setValue('skills', skillsArray);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">프로필을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">내 프로필</h1>
          <p className="text-gray-600">프로필 정보를 관리하고 업데이트하세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 프로필 카드 */}
          <div className="lg:col-span-1">
            <div className="card p-6 text-center">
              <div className="mb-6">
                <img
                  src={profile?.profile.imageUrl || 'https://via.placeholder.com/120x120/e5e7eb/6b7280?text=' + encodeURIComponent(profile?.profile.name?.charAt(0) || 'U')}
                  alt={profile?.profile.name || 'Profile'}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-gray-100 shadow-md"
                />
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {profile?.profile.name || '이름 없음'}
                </h2>
                <p className="text-blue-600 font-medium text-sm capitalize">
                  {profile?.role === 'mentor' ? '멘토' : '멘티'}
                </p>
              </div>

              {profile?.profile.bio && (
                <div className="mb-6 text-left">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">소개</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {profile.profile.bio}
                  </p>
                </div>
              )}

              {profile?.profile.skills && profile.profile.skills.length > 0 && (
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">기술 스택</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.profile.skills.map((skill, index) => (
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
            </div>
          </div>

          {/* 프로필 편집 폼 */}
          <div className="lg:col-span-2">
            <div className="card p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">프로필 편집</h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    이름
                  </label>
                  <input
                    type="text"
                    {...register('name', { required: '이름을 입력해주세요' })}
                    className="input-field w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                    placeholder="이름을 입력하세요"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-2 font-medium">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    자기소개
                  </label>
                  <textarea
                    {...register('bio')}
                    rows={4}
                    className="input-field w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="자신을 간단히 소개해보세요..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    기술 스택
                  </label>
                  <input
                    type="text"
                    onChange={handleSkillsChange}
                    defaultValue={profile?.profile.skills?.join(', ') || ''}
                    className="input-field w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                    placeholder="예: React, TypeScript, Python (쉼표로 구분)"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    쉼표(,)로 구분하여 여러 기술을 입력하세요
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-lg hover:shadow-xl"
                  >
                    {updating ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        업데이트 중...
                      </div>
                    ) : (
                      '프로필 업데이트'
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors duration-200"
                  >
                    홈으로
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* 추가 정보 섹션 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">계정 정보</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">이메일: </span>
                <span className="text-sm text-gray-600">{profile?.email}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">역할: </span>
                <span className="text-sm text-gray-600 capitalize">
                  {profile?.role === 'mentor' ? '멘토' : '멘티'}
                </span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 이동</h3>
            <div className="space-y-2">
              {profile?.role === 'mentee' && (
                <button
                  onClick={() => router.push('/mentors')}
                  className="w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  멘토 찾기 →
                </button>
              )}
              <button
                onClick={() => router.push('/requests')}
                className="w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              >
                {profile?.role === 'mentor' ? '받은 요청' : '보낸 요청'} →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
