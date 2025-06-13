import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ViewNightSpot } from '@/features/map/types/mapTypes';
import { SUBJECTS } from '@/features/map/constants/subjects';
import dayjs from 'dayjs';
import { useMapContext } from '@/features/map/context';

export interface CreatePlaceInfo {
  latlng: naver.maps.Coord;
  address: string;
}

export const EditPlaceModal = ({
  open,
  onClose,
  mode,
  createPlaceInfo,
  updatePlaceInfo,
}: {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'update';
  createPlaceInfo?: CreatePlaceInfo;
  updatePlaceInfo?: ViewNightSpot;
}) => {
  const { addCustomPlace, updateCustomPlace, deleteCustomPlace } = useAuth();
  const {
    handlePlaceSelect,
    setIsSidebarOpen,
    selectedInfoWindowRef,
    selectedMarkerRef,
    setSelectedPlace,
  } = useMapContext();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      subject: '기타',
      title: '',
      addr: '',
      operatingTime: '',
      telNo: '',
      url: '',
      contents: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (mode === 'create') {
        if (!createPlaceInfo) return;
        reset({
          subject: '기타',
          title: '',
          addr: createPlaceInfo.address,
          contents: '',
        });
      } else {
        if (!updatePlaceInfo) return;
        reset({
          subject: updatePlaceInfo.SUBJECT_CD,
          title: updatePlaceInfo.TITLE,
          addr: updatePlaceInfo.ADDR,
          contents: updatePlaceInfo.CONTENTS,
          operatingTime: updatePlaceInfo.OPERATING_TIME,
          telNo: updatePlaceInfo.TEL_NO,
          url: updatePlaceInfo.URL,
        });
      }
    }
  }, [createPlaceInfo, updatePlaceInfo, mode, open, reset]);

  const addPlace = ({
    subject,
    title,
    addr,
    contents,
  }: {
    subject: string;
    title: string;
    addr: string;
    contents: string;
  }) => {
    if (!createPlaceInfo) {
      return;
    }

    const newPlace: ViewNightSpot = {
      NUM: '',
      ID: `my_${createPlaceInfo.latlng.y}_${createPlaceInfo.latlng.x}`,
      SUBJECT_CD: subject,
      TITLE: title,
      ADDR: addr,
      LA: createPlaceInfo.latlng.y.toString(),
      LO: createPlaceInfo.latlng.x.toString(),
      ...(contents && { CONTENTS: contents }),
      REG_DATE: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      MOD_DATE: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      IS_FAVORITE: false,
    };

    addCustomPlace(newPlace);

    onClose();
    setTimeout(() => handlePlaceSelect(newPlace), 500);
  };

  const updatePlace = ({
    subject,
    title,
    addr,
    operatingTime,
    telNo,
    url,
    contents,
  }: {
    subject: string;
    title: string;
    addr: string;
    operatingTime: string;
    telNo: string;
    url: string;
    contents: string;
  }) => {
    if (!updatePlaceInfo) {
      return;
    }

    const updatedPlace: ViewNightSpot = {
      ...updatePlaceInfo,
      ...{
        SUBJECT_CD: subject,
        TITLE: title,
        ADDR: addr,
        OPERATING_TIME: operatingTime,
        TEL_NO: telNo,
        URL: url,
        CONTENTS: contents,
        MOD_DATE: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      },
    };

    updateCustomPlace(updatedPlace);
			
    if (selectedInfoWindowRef.current) {
      selectedInfoWindowRef.current.close();
      selectedInfoWindowRef.current = null;
    }
    
    if (selectedMarkerRef.current) {
      const { marker } = selectedMarkerRef.current;
      marker.setMap(null);
      selectedMarkerRef.current = null;
    }
			// setSelectedPlace(null);
    onClose();
		setTimeout(() => handlePlaceSelect(updatedPlace), 500);
  };
	
	const deletePlace = () => {
		if (!updatePlaceInfo) {
      return;
    }
    
    const checkDelete = confirm('정말 삭제하시겠습니까?');
    if (!checkDelete) {
      return;
    } 
		deleteCustomPlace(updatePlaceInfo);
		
		if (selectedInfoWindowRef.current) {
      selectedInfoWindowRef.current.close();
      selectedInfoWindowRef.current = null;
    }

    if (selectedMarkerRef.current) {
      const { marker } = selectedMarkerRef.current;
      marker.setMap(null);
      selectedMarkerRef.current = null;
			
    }
    setSelectedPlace(null);
		
		onClose();
		setIsSidebarOpen(false);
	}

  return (
    <dialog open={open} className="modal">
      <div className="modal-box">
        <h3 className="text-lg font-bold">{mode === 'create' ? '내 장소 추가' : '장소 수정'}</h3>

        <form noValidate onSubmit={handleSubmit(mode === 'create' ? addPlace : updatePlace)}>
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

            <div>
              <label htmlFor="addr" className="label mt-2">
                주소
              </label>
              <input
                className="input w-full focus:border-base-content/20 focus:shadow-none focus:outline-none"
                id="addr"
                readOnly
                {...register('addr')}
              />
            </div>

            {mode === 'update' && (
              <>
                <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <label htmlFor="operatingTime" className="label mt-2">
                      운영시간
                    </label>
                    <input
                      id="operatingTime"
                      className="input w-full"
                      {...register('operatingTime')}
                    />
                  </div>

                  <div>
                    <label htmlFor="telNo" className="label mt-2">
                      전화번호
                    </label>
                    <input className="input w-full" id="telNo" {...register('telNo')} />
                  </div>
                </div>
                <div>
                  <label htmlFor="url" className="label mt-2">
                    URL
                  </label>
                  <input className="input w-full" id="url" {...register('url')} />
                </div>
              </>
            )}

            <div>
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
            </div>
          </fieldset>

          <div className="modal-action">
            <button type="button" className="btn btn-sm" onClick={onClose}>
              닫기
            </button>
            {mode === 'update' && (
              <button type="button" className="btn btn-sm" onClick={deletePlace}>
                삭제
              </button>
            )}
            <button type="submit" className="btn btn-sm">
              저장
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};
