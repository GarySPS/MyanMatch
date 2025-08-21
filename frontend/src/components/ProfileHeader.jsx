// src/components/ProfileHeader.jsx
import { HiCheckBadge } from "react-icons/hi2";
import { FiMoreVertical } from "react-icons/fi";

export default function ProfileHeader({ name, verified }) {
  return (
    <div className="flex items-center justify-between px-2 py-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">{name}</span>
        {verified && (
          <HiCheckBadge className="text-xl text-blue-500" title="Verified" />
        )}
      </div>
      <button className="p-1">
        <FiMoreVertical size={22} />
      </button>
    </div>
  );
}
