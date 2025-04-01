import { LoginForm } from '@/features/auth/components/LoginForm';
import { HomeLogo } from '@/components/common/HomeLogo';

export const LoginPage = () => {
  return (
    <div className="h-screen">
      <div className="flex h-full w-full flex-col items-center justify-center pb-20">
        <HomeLogo />
        <LoginForm />
      </div>
    </div>
  );
};
