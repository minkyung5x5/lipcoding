'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { setToken } from '@/lib/auth';
import { LoginRequest } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>();

  const onSubmit = async (data: LoginRequest) => {
    setLoading(true);
    try {
      const response = await api.post('/login', data);
      setToken(response.data.token);
      toast.success('로그인 성공!');
      router.push('/profile');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">로그인</h1>
            <p className="text-gray-600">MentorMatch에 오신 것을 환영합니다</p>
          </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              이메일 주소
            </label>
            <input
              id="email"
              type="email"
              {...register('email', { 
                required: '이메일을 입력해주세요',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: '올바른 이메일 형식을 입력해주세요'
                }
              })}
              className="input-field w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
              placeholder="이메일을 입력하세요"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-2 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              {...register('password', { required: '비밀번호를 입력해주세요' })}
              className="input-field w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
              placeholder="비밀번호를 입력하세요"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-2 font-medium">{errors.password.message}</p>
            )}
          </div>

          <button
            id="login"
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 px-4 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                로그인 중...
              </div>
            ) : (
              '로그인'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            계정이 없으신가요?{' '}
            <button
              onClick={() => router.push('/signup')}
              className="font-semibold text-blue-600 hover:text-blue-500 transition-colors duration-200"
            >
              회원가입
            </button>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
