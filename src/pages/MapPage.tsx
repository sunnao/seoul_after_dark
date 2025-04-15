import { Map } from "@/features/map/components/Map"
import { MapProvider } from "@/features/map/context"


export const MapPage = () => {
	return <div className="h-full w-full p-5 md:p-10">
		<MapProvider>
			<Map />
		</MapProvider>
	</div>
}
