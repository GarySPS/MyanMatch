import { LuRuler } from "react-icons/lu";
import { 
  FaHeart, FaUser, FaRuler, FaWineGlass, FaLeaf, FaTimes, FaPills, FaFire, 
  FaEyeSlash, FaGlobe, FaSearch, FaMapMarkerAlt // <-- Add here!
} from "react-icons/fa";
import { 
  HiOutlineEye, HiOutlineAcademicCap, 
  HiOutlineShoppingCart, HiOutlineHome, HiOutlineBriefcase, 
  // HiOutlineLocationMarker // REMOVE this!
} from "react-icons/hi2";

// Map string keys to icon components
export const Icons = {
  heart: FaHeart,
  user: FaUser,
  height: LuRuler,
  eye: HiOutlineEye,
  eyeoff: FaEyeSlash,
  wine: FaWineGlass,
  leaf: FaLeaf,
  times: FaTimes,
  pills: FaPills,
  academiccap: HiOutlineAcademicCap,
  globe: FaGlobe,
  shoppingcart: HiOutlineShoppingCart,
  home: HiOutlineHome,
  search: FaSearch,
  briefcase: HiOutlineBriefcase,
  location: FaMapMarkerAlt,   // <--- USE THIS!
  fire: FaFire,
  // ...add more as you standardize!
};
