import { logoImage } from '@/constants/images';
import { Link, useNavigate } from 'react-router-dom';

import { FiMail } from 'react-icons/fi';
import { RiLockPasswordLine } from 'react-icons/ri';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';

interface LoginFormValues {
  email: string;
  password: string;
}

export const LoginPage = () => {
  const [apiError, setApiError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    const result = login(data.email, data.password);

    if (result) {
      navigate('/');
    } else {
      setApiError('이메일 또는 비밀번호가 틀렸습니다.');
    }
  };

  return (
    <div className="h-screen">
      <div className="flex h-full w-full flex-col items-center justify-center pb-20">
        <Link to="/">
          <div className="mb-15">
            <img src={logoImage} alt="logo" className="mx-auto h-20 w-20" />
            <h2 className="font-bold">SEOUL AFTER DARK</h2>
          </div>
        </Link>

        {apiError && (
          <div className="mb-3 alert flex w-70 justify-between alert-error">
            <span>{apiError}</span>
          </div>
        )}

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="w-70">
          <fieldset className="fieldset">
            {/* email */}
            <label className={`input w-full ${errors.email ? 'input-error' : ''}`}>
              <FiMail className="h-[1em] opacity-50" />
              <input
                type="email"
                placeholder="mail@site.com"
                {...register('email', {
                  required: '이메일을 입력해주세요',
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: '이메일 양식이 올바르지 않습니다',
                  },
                })}
              />
            </label>
            {errors.email && <label className="text-error">{errors.email.message}</label>}

            {/* password */}
            <label className={`input mt-3 w-full ${errors.password ? 'input-error' : ''}`}>
              <RiLockPasswordLine className="h-[1em] opacity-50" />
              <input
                type="password"
                placeholder="******"
                {...register('password', {
                  required: '비밀번호를 입력해주세요',
                  minLength: {
                    value: 6,
                    message: '6자 이상 입력해주세요',
                  },
                })}
              />
            </label>
            {errors.password && (
              <label>
                <span className="text-error">{errors.password.message}</span>
              </label>
            )}

            <div className="mt-4 flex justify-between">
              {/* <a className="link link-hover">비밀번호 찾기</a> */}
              <Link to="/join" className="link text-sm link-hover">
                회원가입
              </Link>
            </div>

            <button className="btn mt-4 btn-neutral">로그인</button>
          </fieldset>
        </form>
      </div>
    </div>
  );
};
