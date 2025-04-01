import { JoinForm } from '@/features/auth/components/JoinForm';
import { HomeLogo } from '@/components/common/HomeLogo';

export const JoinPage = () => {
  return (
    <div className="h-screen">
      <div className="flex h-full w-full flex-col items-center justify-center pb-20">
        <HomeLogo />
        <JoinForm />
      </div>
    </div>
  );
};
