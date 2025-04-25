import { AuthInput } from '@/features/auth/components/AuthInput';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEffect, useState } from 'react';

interface ProfileFormProps {
  isEditMode: boolean;
  toogleEditMode: () => void;
}

export const ProfileForm = ({ isEditMode, toogleEditMode }: ProfileFormProps) => {
  const { user, updateUser } = useAuth();
  const [updateResult, setUpdateResult] = useState({
    success: false,
    message: '',
  });
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      username: '',
      password: '',
      passwordCheck: '',
    },
  });

  useEffect(() => {
    if (user) {
      if (user.joinType === 'email') {
        reset({
        email: user.email,
        username: user.username,
        password: '',
        passwordCheck: '',
      });
        
      } else {
        reset({
          email: '',
          username: user.username,
          password: '',
          passwordCheck: '',
        });
      }
      
    }
  }, [user, reset, isEditMode]);

  const onSubmit = (data: { email: string; password: string; username: string }) => {
    const result = updateUser(
      user!.joinType === 'email'
        ? {
            joinType: 'email',
            email: data.email,
            password: data.password,
            username: data.username,
          }
        : {
            joinType: 'kakao',
            username: data.username,
            kakaoMemberId: user!.kakaoMemberId,
            kakaoNickname: user!.kakaoNickname,
          },
    );
    setUpdateResult(result);

    if (result.success) {
      toogleEditMode();
    }

    setTimeout(() => {
      setUpdateResult({
        success: false,
        message: '',
      });
    }, 1000);
  };

  return (
    <>
      {updateResult.message && (
        <div
          className={`mb-3 alert flex w-70 justify-between alert-error ${updateResult.success ? 'alert-success' : 'alert-error'}`}
        >
          <span>{updateResult.message}</span>
        </div>
      )}

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="w-70">
        <fieldset className="fieldset">
          <AuthInput
            label="닉네임"
            type="text"
            placeholder=""
            error={errors.username}
            disabled={!isEditMode}
            registration={register('username', {
              required: '닉네임을 입력해주세요',
              setValueAs: (value) => value.trim(),
            })}
          />
          <AuthInput
            label="이메일"
            type="email"
            placeholder={user?.joinType === 'email' ? '' : '카카오 계정 연동'}
            disabled={true}
            registration={register('email')}
          />

          {user?.joinType === 'email' && (
            <AuthInput
              label="비밀번호"
              type="password"
              placeholder=""
              error={errors.password}
              disabled={!isEditMode}
              registration={register('password', {
                required: '비밀번호를 입력해주세요',
                minLength: {
                  value: 6,
                  message: '6자 이상 입력해주세요',
                },
              })}
            />
          )}
          {isEditMode && (
            <>
              {user?.joinType === 'email' && (
                <AuthInput
                  label="비밀번호 확인"
                  type="password"
                  placeholder=""
                  error={errors.passwordCheck}
                  disabled={!isEditMode}
                  registration={register('passwordCheck', {
                    validate: (value) =>
                      value === watch('password') || '비밀번호가 일치하지 않습니다',
                  })}
                />
              )}
              <button type="submit" className="btn mt-3 btn-neutral">
                저장
              </button>
            </>
          )}
        </fieldset>
      </form>
    </>
  );
};
