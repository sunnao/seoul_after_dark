import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { FaAngleDown } from 'react-icons/fa6';

export const Header = () => {
  const { user, logout } = useAuth();
  
  const kauthLogoutParams = new URLSearchParams({
    client_id: import.meta.env.VITE_KAKAO_CLIENT_ID,
    logout_redirect_uri: import.meta.env.VITE_REDIRECT_KAKAO_LOOUT,
    response_type: 'code',
  });

  return (
    <header>
      <div className="navbar bg-base-200 shadow-sm">
        <div className="flex-none">
          <label
            htmlFor="my-drawer-2"
            className="btn btn-square btn-ghost"
            aria-label="open sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block h-5 w-5 stroke-current"
            >
              {' '}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>{' '}
            </svg>
          </label>
        </div>
        <div className="flex-1">
          <Link to="/" className="btn text-xl btn-ghost">
            SEOUL AFTER DARK
          </Link>
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal px-1">
            <li>{!user && <Link to="/login">로그인</Link>}</li>
            {user && (
              <li>
                <div className="dropdown dropdown-end">
                  <div tabIndex={0} className="flex items-center">
                    <span className="mr-2">{user.username} 님</span> <FaAngleDown />
                  </div>
                  <ul
                    tabIndex={0}
                    className="dropdown-content mt-3 w-35 rounded-t-none bg-base-200 p-2"
                  >
                    <li>
                      <Link to="/myPage">마이페이지</Link>
                    </li>
                    <li>
                      <a
                        href={
                          user.joinType === 'kakao'
                            ? `https://kauth.kakao.com/oauth/logout?${kauthLogoutParams}`
                            : undefined
                        }
                        onClick={logout}
                      >
                        로그아웃
                      </a>
                    </li>
                  </ul>
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>
    </header>
  );
};
