import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useState } from 'react';
import { ApiErrorAlert } from '@/features/auth/components/ApiErrorAlert';
import { AuthInput } from '@/features/auth/components/AuthInput';

export const JoinForm = () => {
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
      username: '',
    },
  });

  const onSubmit = (data: { email: string; password: string; username: string }) => {
    const result = join({
      joinType: 'email',
      email: data.email,
      password: data.password,
      name: data.username,
    });

    if (result.success) {
      setApiError('');
      navigate('/login');
    } else {
      setApiError(result.message);
    }
  };

  return (
    <>
      <ApiErrorAlert message={apiError} linkTo="/login" linkText="로그인" />

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="w-70 space-y-4">
        <fieldset className="fieldset">
          {/* email */}
          <AuthInput
            label="이메일 *"
            id="email"
            type="email"
            placeholder="mail@site.com"
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
            label="비밀번호 *"
            id="password"
            type="password"
            placeholder="******"
            error={errors.password}
            registration={register('password', {
              required: '비밀번호를 입력해주세요',
              minLength: {
                value: 6,
                message: '6자 이상 입력해주세요',
              },
            })}
          />

          {/* username */}
          <AuthInput
            label="닉네임"
            id="username"
            type="text"
            placeholder="닉네임"
            registration={register('username', {
              setValueAs: (value) => value.trim(),
            })}
          />

          <button type="submit" className="btn mt-3 btn-neutral">
            회원가입
          </button>
        </fieldset>
      </form>
    </>
  );
};
