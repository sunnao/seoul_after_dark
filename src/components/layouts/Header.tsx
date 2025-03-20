import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header>
      <div className="navbar bg-base-100 shadow-sm">
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
          <a className="btn text-xl btn-ghost">SEOUL AFTER DARK</a>
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal px-1">
            <li>{user ? <a onClick={logout}>로그아웃</a> : <Link to="/login">로그인</Link>}</li>
            {user && <li>
							<span>{user?.username} 님</span>
              {/* <details>
                <summary>Parent</summary>
                <ul className="rounded-t-none bg-base-100 p-2">
                  <li>
                    <a>Link 1</a>
                  </li>
                  <li>
                    <a>Link 2</a>
                  </li>
                </ul>
              </details> */}
            </li>}
          </ul>
        </div>
      </div>
    </header>
  );
};
