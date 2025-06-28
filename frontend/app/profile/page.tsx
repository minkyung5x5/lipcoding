'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { isAuthenticated, getUserFromToken } from '@/lib/auth';
import { UserInfo, ProfileUpdateRequest } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProfileUpdateRequest>();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchUserData();
  }, [router]);

  const fetchUserData = async () => {
    try {
      const response = await api.get('/me');
      const userData = response.data;
      setUser(userData);
      
      // 폼에 기존 데이터 설정
      setValue('name', userData.profile.name);
      setValue('bio', userData.profile.bio || '');
      if (userData.role === 'mentor' && userData.profile.skills) {
        setValue('skills', userData.profile.skills);
      }
      
      setImagePreview(userData.profile.imageUrl || '');
    } catch (error) {
      toast.error('사용자 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 검사
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast.error('JPG 또는 PNG 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 검사 (1MB)
    if (file.size > 1024 * 1024) {
      toast.error('파일 크기는 1MB 이하여야 합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // 이미지 크기 검사
        if (img.width !== img.height) {
          toast.error('정사각형 이미지만 업로드 가능합니다.');
          return;
        }
        if (img.width < 500 || img.width > 1000) {
          toast.error('이미지 크기는 500x500 ~ 1000x1000 픽셀이어야 합니다.');
          return;
        }
        
        const base64 = event.target?.result as string;
        const base64Data = base64.split(',')[1]; // data:image/jpeg;base64, 제거
        setValue('image', base64Data);
        setImagePreview(base64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: ProfileUpdateRequest) => {
    setSaving(true);
    try {
      const response = await api.put('/profile', data);
      setUser(response.data);
      toast.success('프로필이 업데이트되었습니다!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || '프로필 업데이트에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const skillsValue = watch('skills') || [];

  const addSkill = () => {
    const newSkill = prompt('새로운 기술을 입력하세요:');
    if (newSkill && newSkill.trim()) {
      setValue('skills', [...skillsValue, newSkill.trim()]);
    }
  };

  const removeSkill = (index: number) => {
    const newSkills = skillsValue.filter((_, i) => i !== index);
    setValue('skills', newSkills);
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">프로필 관리</h1>
          <p className="text-gray-600">
            {user.role === 'mentor' ? '멘토로서의 경험과 전문성을 공유해보세요' : '자신을 표현하고 원하는 멘토를 찾아보세요'}
          </p>
        </div>
      
        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* 프로필 이미지 */}
            <div className="text-center">
              <div className="relative inline-block">
                <img
                  id="profile-photo"
                  src={imagePreview || user.profile.imageUrl}
                  alt="프로필 이미지"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
                <div className="absolute bottom-0 right-0">
                  <label htmlFor="profile" className="cursor-pointer bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors duration-200 shadow-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </label>
                </div>
              </div>
              <input
                id="profile"
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleImageChange}
                className="hidden"
              />
              <p className="text-sm text-gray-500 mt-2">
                JPG, PNG 파일만 업로드 가능 (최대 1MB, 500x500~1000x1000px)
              </p>
            </div>

            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  이름 *
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name', { required: '이름을 입력해주세요' })}
                  className="input-field w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500"
                  placeholder="이름을 입력하세요"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-2 font-medium">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  역할
                </label>
                <div className="input-field w-full px-4 py-3 rounded-lg bg-gray-50 text-gray-700">
                  {user.role === 'mentor' ? '멘토' : '멘티'}
                </div>
              </div>
            </div>

            {/* 소개글 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                소개글
              </label>
              <textarea
                id="bio"
                rows={5}
                {...register('bio')}
                className="input-field w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 resize-none"
                placeholder={user.role === 'mentor' ? 
                  "자신의 경험과 전문성, 멘토링 스타일에 대해 소개해주세요..." :
                  "자신에 대해 간단히 소개하고, 어떤 분야에 관심이 있는지 알려주세요..."}
              />
            </div>

            {/* 기술 스택 (멘토만) */}
            {user.role === 'mentor' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  기술 스택
                </label>
                <div id="skillsets" className="space-y-4">
                  <div className="flex flex-wrap gap-3 min-h-[3rem] p-4 border-2 border-dashed border-gray-300 rounded-lg">
                    {skillsValue.length > 0 ? (
                      skillsValue.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(index)}
                            className="ml-2 text-blue-600 hover:text-blue-800 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-400 text-sm">기술 스택을 추가해주세요</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={addSkill}
                    className="inline-flex items-center px-4 py-2 border border-blue-300 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    기술 추가
                  </button>
                </div>
              </div>
            )}

            {/* 계정 정보 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">계정 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">이메일:</span>
                  <span className="ml-2 font-medium text-gray-900">{user.email}</span>
                </div>
                <div>
                  <span className="text-gray-500">역할:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {user.role === 'mentor' ? '멘토' : '멘티'}
                  </span>
                </div>
              </div>
            </div>

            {/* 저장 버튼 */}
            <div className="text-center">
              <button
                id="save"
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {saving ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    저장 중...
                  </div>
                ) : (
                  '프로필 저장'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
