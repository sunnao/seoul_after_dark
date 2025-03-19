import { logoImage } from '@/constants/images';
import { Link } from 'react-router-dom';

import { FiMail } from 'react-icons/fi';
import { RiLockPasswordLine } from 'react-icons/ri';

export const LoginPage = () => {
  return (
    <div className="h-screen">
      <div className="flex h-full w-full flex-col items-center justify-center pb-20">
        <Link to="/">
          <div className="mb-15">
            <img src={logoImage} alt="logo" className="mx-auto h-20 w-20" />
            <h2 className="font-bold">SEOUL AFTER DARK</h2>
          </div>
        </Link>

        <div className="card w-full max-w-sm shrink-0 bg-base-100 shadow-2xl">
          <div className="card-body">
            <fieldset className="fieldset">
							
							{/* email */}
              <label className="validator input mb-3">
                <FiMail className="h-[1em] opacity-50" />
                <input type="email" placeholder="mail@site.com" required />
              </label>
              <div className="validator-hint hidden">Enter valid email address</div>
							
							{/* password */}
              <label className="validator input">
                <RiLockPasswordLine className="h-[1em] opacity-50" />
                <input
                  type="password"
                  required
                  placeholder="Password"
                  minLength={8}
                  pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                  title="Must be more than 8 characters, including number, lowercase letter, uppercase letter"
                />
              </label>
              <div className="validator-hint hidden">
                Must be more than 8 characters, including
                <br />
                At least one number
                <br />
                At least one lowercase letter
                <br />
                At least one uppercase letter
              </div>
              <div>
                <a className="link link-hover">Forgot password?</a>
              </div>
              <button className="btn mt-4 btn-neutral">Login</button>
            </fieldset>
          </div>
        </div>
      </div>
    </div>
  );
};
