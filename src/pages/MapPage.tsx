import { Map } from '@/features/map/components/Map';
import { MapProvider, MapDirectionProvider } from '@/features/map/context';

export const MapPage = () => {
  return (
    <div className="h-full w-full p-5 md:p-10">
      
        <MapDirectionProvider>
					<MapProvider>
						<Map />
					</MapProvider>
        </MapDirectionProvider>
    </div>
  );
};
