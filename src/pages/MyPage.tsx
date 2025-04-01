import { EditProfile } from '@/features/auth/components/EditProfile';

export const MyPage = () => {
  return (
    <div className="h-full w-full p-10">
      <div className="flex flex-col items-center justify-center">
        <div className="font-bold">마이페이지</div>
        <EditProfile />
      </div>
    </div>
  );
};
