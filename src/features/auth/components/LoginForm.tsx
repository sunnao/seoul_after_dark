import { ApiErrorAlert } from '@/features/auth/components/ApiErrorAlert';
import { AuthInput } from '@/features/auth/components/AuthInput';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { BsChatFill } from 'react-icons/bs';
import { FiMail } from 'react-icons/fi';
import { RiLockPasswordLine } from 'react-icons/ri';
import { Link, useNavigate } from 'react-router-dom';

export const LoginForm = () => {
  const [apiError, setApiError] = useState('');
  const navigate = useNavigate();
  const { emailLogin } = useAuth();
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

  const kauthLoginParams = new URLSearchParams({
    client_id: import.meta.env.VITE_KAKAO_CLIENT_ID,
    redirect_uri: import.meta.env.VITE_REDIRECT_KAKAO_LOGIN,
    response_type: 'code',
  });

  const onSubmit = (data: { email: string; password: string }) => {
    const result = emailLogin(data.email, data.password);

    if (result) {
      navigate('/');
    } else {
      setApiError('이메일 또는 비밀번호가 틀렸습니다.');
    }
  };

  return (
    <>
      <ApiErrorAlert message={apiError} />

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="w-70">
        <fieldset className="fieldset">
          {/* email */}
          <AuthInput
            type="email"
            placeholder="mail@site.com"
            labelIcon={<FiMail />}
            error={errors.email}
            registration={register('email', {
              required: '이메일을 입력해주세요',
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: '이메일 양식이 올바르지 않습니다',
              },
            })}
          />

          {/* password */}
          <AuthInput
            type="password"
            placeholder="******"
            labelIcon={<RiLockPasswordLine />}
            error={errors.password}
            registration={register('password', {
              required: '비밀번호를 입력해주세요',
              minLength: {
                value: 6,
                message: '6자 이상 입력해주세요',
              },
            })}
          />

          <div className="mt-4 flex justify-between">
            {/* <a className="link link-hover">비밀번호 찾기</a> */}
            <Link to="/join" className="link text-sm link-hover">
              회원가입
            </Link>
          </div>

          <button className="btn mt-4 btn-neutral">로그인</button>
        </fieldset>
      </form>

      {/* 카카오 로그인 */}
      <a href={`https://kauth.kakao.com/oauth/authorize?${kauthLoginParams.toString()}`}>
        <button className="btn relative mt-4 w-70 border-[#FEE500] bg-[#FEE500] text-black/85">
          <BsChatFill className="absolute left-5" /> <span>카카오 로그인</span>
        </button>
      </a>
    </>
  );
};
