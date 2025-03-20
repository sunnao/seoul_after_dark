import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { logoImage } from '@/constants/images';

export const JoinPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { join } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const username = email.split('@')[0];
    const result = join(username, email, password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
    console.log('e', e);
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

        {error && (
          <div className="mb-3 alert flex w-70 justify-between alert-error">
            <span>{error}</span>
            <Link to="/login" className="link font-bold link-hover">
              로그인
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <fieldset className="fieldset w-70">
            {/* email */}
            <label>이메일</label>
            <label className="validator input">
              <input
                type="email"
                placeholder="mail@site.com"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <div className="validator-hint hidden">이메일 양식이 올바르지 않습니다.</div>

            {/* password */}
            <label className="mt-3">비밀번호</label>
            <label className="validator input">
              <input
                type="password"
                placeholder="Password"
                minLength={6}
                title="6자 이상 입력해주세요"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <div className="validator-hint hidden">6자 이상 입력해주세요.</div>
            <div className="text-end"></div>

            <button type="submit" className="btn mt-4 btn-neutral">
              회원가입
            </button>
          </fieldset>
        </form>
      </div>
    </div>
  );
};
