import { ProfileForm } from "@/features/auth/components/ProfileForm";
import { useState } from "react";

export const EditProfile = () => {
const [isEditMode, setIsEditMode] = useState(false);
	
const toogleEditMode = () => {
  setIsEditMode(!isEditMode);
};
	return (
    <div className="flex flex-col items-center p-5">
      <div className="self-end">
        <button className="btn font-normal btn-sm" onClick={toogleEditMode}>
          {isEditMode ? '취소' : '수정하기'}
        </button>
      </div>
      <ProfileForm isEditMode={isEditMode} toogleEditMode={toogleEditMode} />
    </div>
  );
};