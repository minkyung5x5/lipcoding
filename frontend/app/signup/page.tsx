'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { SignupRequest } from '@/types';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<SignupRequest>();

  const onSubmit = async (data: SignupRequest) => {
    setLoading(true);
    try {
      await api.post('/signup', data);
      toast.success('회원가입이 완료되었습니다!');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">회원가입</h1>
            <p className="text-gray-600">MentorMatch와 함께 성장해보세요</p>
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
                {...register('password', { 
                  required: '비밀번호를 입력해주세요',
                  minLength: {
                    value: 6,
                    message: '비밀번호는 6자 이상이어야 합니다'
                  }
                })}
                className="input-field w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                placeholder="비밀번호를 입력하세요 (6자 이상)"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-2 font-medium">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                이름
              </label>
              <input
                id="name"
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
                역할
              </label>
              <select
                id="role"
                {...register('role', { required: '역할을 선택해주세요' })}
                className="input-field w-full px-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">역할을 선택하세요</option>
                <option value="mentee">멘티 (멘토링을 받고 싶어요)</option>
                <option value="mentor">멘토 (멘토링을 제공하고 싶어요)</option>
              </select>
              {errors.role && (
                <p className="text-red-500 text-sm mt-2 font-medium">{errors.role.message}</p>
              )}
            </div>

            <button
              id="signup"
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 px-4 rounded-lg font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  가입 중...
                </div>
              ) : (
                '회원가입'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              이미 계정이 있으신가요?{' '}
              <button
                onClick={() => router.push('/login')}
                className="font-semibold text-purple-600 hover:text-purple-500 transition-colors duration-200"
              >
                로그인
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
