import { logoImage } from '@/constants/images';
import { Link, useNavigate } from 'react-router-dom';

import { FiMail } from 'react-icons/fi';
import { RiLockPasswordLine } from 'react-icons/ri';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
	const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
	
	const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const result = login(email, password);

    if (result) {
      navigate('/');
    } else {
      setError('이메일 또는 비밀번호가 틀렸습니다.');
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
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <fieldset className="fieldset w-70">
            {/* email */}
            <label className="validator input">
              <FiMail className="h-[1em] opacity-50" />
              <input
                type="email"
                placeholder="mail@site.com"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <div className="validator-hint hidden">이메일 양식이 올바르지 않습니다.</div>

            {/* password */}
            <label className="validator input mt-3">
              <RiLockPasswordLine className="h-[1em] opacity-50" />
              <input
                type="password"
                required
                placeholder="Password"
                minLength={6}
                title="6자 이상 입력해주세요"
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <div className="validator-hint hidden">6자 이상 입력해주세요.</div>
            <div className="flex justify-between">
              {/* <a className="link link-hover">비밀번호 찾기</a> */}
              <Link to="/join" className="link link-hover">
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
