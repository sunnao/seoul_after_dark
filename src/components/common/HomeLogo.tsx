import { logoImage } from "@/constants/images";
import { Link } from "react-router-dom";

export const HomeLogo = () => {
	return (
    <Link to="/">
      <div className="mb-15">
        <img src={logoImage} alt="logo" className="mx-auto h-20 w-20" />
        <h2 className="font-bold">SEOUL AFTER DARK</h2>
      </div>
    </Link>
  );
}