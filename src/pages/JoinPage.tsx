import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { logoImage } from '@/constants/images';
import { useForm } from 'react-hook-form';

export const JoinPage = () => {
  const [apiError, setApiError] = useState('');
  const navigate = useNavigate();
  const { join } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: { email: string; password: string }) => {
    const username = data.email.split('@')[0];
    const result = join(username, data.email, data.password);

    if (result.success) {
      setApiError('');
      navigate('/');
    } else {
      setApiError(result.message);
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
            <Link to="/login" className="link font-bold link-hover">
              로그인
            </Link>
          </div>
        )}

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="w-70 space-y-4">
          <fieldset className="fieldset">
            {/* email */}
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              type="email"
              placeholder="mail@site.com"
              className={`input ${errors.email ? 'input-error' : ''}`}
              {...register('email', {
                required: '이메일을 입력해주세요',
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: '이메일 양식이 올바르지 않습니다',
                },
              })}
            />
            {errors.email && <label className="text-error">{errors.email.message}</label>}

            {/* password */}

            <label htmlFor="password">
              <span>비밀번호</span>
            </label>
            <input
              id="password"
              type="password"
              placeholder="******"
              className={`input ${errors.password ? 'input-error' : ''}`}
              {...register('password', {
                required: '비밀번호를 입력해주세요',
                minLength: {
                  value: 6,
                  message: '6자 이상 입력해주세요',
                },
              })}
            />
            {errors.password && (
              <label>
                <span className="text-error">{errors.password.message}</span>
              </label>
            )}

            <button type="submit" className="btn mt-3 btn-neutral">
              회원가입
            </button>
          </fieldset>
        </form>
      </div>
    </div>
  );
};
