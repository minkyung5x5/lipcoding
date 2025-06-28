'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Link from 'next/link';
import api from '@/lib/api';
import { setToken } from '@/lib/auth';
import { LoginRequest } from '@/types';

// 로딩 스피너 컴포넌트
const LoadingSpinner = () => (
  <div className="flex items-center justify-center">
    <div className="spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
    로그인 중...
  </div>
);

// 로고 컴포넌트
const Logo = () => (
  <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
    <span className="text-white font-bold text-xl">M</span>
  </div>
);

// 입력 필드 컴포넌트
interface InputFieldProps {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  register: any;
  validation: any;
  error?: string;
}

const InputField = ({ id, label, type, placeholder, register, validation, error }: InputFieldProps) => (
  <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-semibold text-gray-700">
      {label}
    </label>
    <input
      id={id}
      type={type}
      {...register(id, validation)}
      className={`input-field w-full px-4 py-3 rounded-lg transition-all duration-200 ${
        error 
          ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
      }`}
      placeholder={placeholder}
    />
    {error && (
      <p className="text-red-500 text-sm font-medium flex items-center">
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {error}
      </p>
    )}
  </div>
);

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>();

  const onSubmit = async (data: LoginRequest) => {
    setLoading(true);
    try {
      const response = await api.post('/login', data);
      setToken(response.data.token);
      toast.success('로그인 성공! 프로필 페이지로 이동합니다.', {
        duration: 2000,
        icon: '🎉',
      });
      
      // 짧은 지연 후 리다이렉트 (사용자가 성공 메시지를 볼 수 있도록)
      setTimeout(() => {
        router.push('/profile');
      }, 1000);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || '로그인에 실패했습니다.', {
        duration: 4000,
        icon: '❌',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full fade-in">
        <div className="card p-8 shadow-xl">
          <div className="text-center mb-8">
            <Logo />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">로그인</h1>
            <p className="text-gray-600">MentorMatch에 오신 것을 환영합니다</p>
          </div>
        
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <InputField
              id="email"
              label="이메일 주소"
              type="email"
              placeholder="이메일을 입력하세요"
              register={register}
              validation={{ 
                required: '이메일을 입력해주세요',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: '올바른 이메일 형식을 입력해주세요'
                }
              }}
              error={errors.email?.message}
            />

            <InputField
              id="password"
              label="비밀번호"
              type="password"
              placeholder="비밀번호를 입력하세요"
              register={register}
              validation={{ 
                required: '비밀번호를 입력해주세요',
                minLength: {
                  value: 6,
                  message: '비밀번호는 6자 이상이어야 합니다'
                }
              }}
              error={errors.password?.message}
            />

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <LoadingSpinner /> : '로그인'}
            </button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>
            
            <p className="text-gray-600">
              계정이 없으신가요?{' '}
              <Link
                href="/signup"
                className="font-semibold text-blue-600 hover:text-blue-500 transition-colors duration-200"
              >
                회원가입
              </Link>
            </p>
            
            <Link
              href="/"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
