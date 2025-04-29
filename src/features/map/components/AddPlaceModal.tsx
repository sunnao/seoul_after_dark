import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ViewNightSpot } from '@/features/map/types/mapTypes';
import { SUBJECTS } from '@/features/map/constants/subjects';
import dayjs from 'dayjs';
import { useMapContext } from '@/features/map/context';

export const AddPlaceModal = ({
  latlng,
  address,
  open,
  onClose,
}: {
  latlng: naver.maps.Coord | null;
  address: string;
  open: boolean;
  onClose: () => void;
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
	const { user, updateUser } = useAuth();
	const { handlePlaceSelect } = useMapContext();
	
	const {
    register,
    handleSubmit,
		reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      subject: '기타',
      title: '',
      addr: address,
      contents: '',
    },
  });

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
			reset({
        subject: '기타',
        title: '',
        addr: address,
        contents: '',
      });
    } else {
      dialogRef.current?.close();
    }
  }, [address, open, reset]);

  const addPlace = ({ subject, title, addr, contents }: {
  subject: string;
  title: string;
  addr: string;
  contents: string;
}) => {
    if (!user || !latlng) {
      return;
    }

    const newPlace: ViewNightSpot = {
      ID: `my_${latlng.y}_${latlng.x}`,
      SUBJECT_CD: subject,
      TITLE: title,
      ADDR: addr,
      LA: latlng.y.toString(),
      LO: latlng.x.toString(),
      ...(contents && { CONTENTS: contents }),
      REG_DATE: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      MOD_DATE: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      IS_FAVORITE: false,
    };

    const newUserInfo = { ...user };
    newUserInfo.customPlaces = [...(newUserInfo.customPlaces || []), newPlace];
    updateUser(newUserInfo);
		
		onClose();
		setTimeout(() => handlePlaceSelect(newPlace), 500);
  };

  return (
    <dialog ref={dialogRef} id="my_modal_1" className="modal">
      <div className="modal-box">
        <h3 className="text-lg font-bold">내 장소 추가</h3>

        <form noValidate onSubmit={handleSubmit(addPlace)}>
          <fieldset className="fieldset">
            <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label htmlFor="subject" className="label mt-2">
                  카데고리
                </label>
                <select
                  id="subject"
                  defaultValue="기타"
                  className="select w-full"
                  {...register('subject')}
                >
                  <option disabled={true}>카테고리 선택</option>
                  {SUBJECTS.map((ele) =>
                    ele.name !== '전체' ? <option key={ele.id}>{ele.name}</option> : null,
                  )}
                </select>
              </div>

              <div>
                <label htmlFor="title" className="label mt-2">
                  장소명
                </label>
                <input
                  className="input w-full"
                  id="title"
                  {...register('title', {
                    required: '장소명은 필수입니다.',
                    setValueAs: (value) => value.trim(),
                  })}
                />
                {errors.title && <span className="text-sm text-error">{errors.title.message}</span>}
              </div>
            </div>

            <label htmlFor="addr" className="label mt-2">
              주소
            </label>
            <input
              className="input w-full focus:border-base-content/20"
              id="addr"
              readOnly
              {...register('addr')}
            />

            <label htmlFor="contents" className="label mt-2">
              설명
            </label>
            <textarea
              className="textarea w-full"
              id="addr"
              {...register('contents', {
                setValueAs: (value) => value.trim(),
              })}
            />
          </fieldset>

          <div className="modal-action">
            <button type="button" className="btn mr-2 btn-sm" onClick={onClose}>
              닫기
            </button>
            <button type="submit" className="btn btn-sm">
              저장
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};
