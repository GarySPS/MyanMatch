import React, { useState } from "react";

const mockBlockedUsers = [
  { id: 1, name: "ကိုအောင်", avatar: "https://i.pravatar.cc/150?img=1" },
  { id: 2, name: "မဟင်္န", avatar: "https://i.pravatar.cc/150?img=2" },
];

export default function BlockedUsersPage() {
  const [blocked, setBlocked] = useState(mockBlockedUsers);

  const handleUnblock = (id) => {
    setBlocked((prev) => prev.filter((user) => user.id !== id));
    // TODO: Backend unblock API call here
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">
        ပိတ်ထားသော အသုံးပြုသူများ
      </h1>
      {blocked.length === 0 ? (
        <div className="text-center text-gray-500">
          ပိတ်ထားသော အသုံးပြုသူ မရှိပါ။
        </div>
      ) : (
        <ul className="space-y-4">
          {blocked.map((user) => (
            <li
              key={user.id}
              className="flex items-center bg-white dark:bg-gray-800 rounded-lg shadow p-4"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-12 h-12 rounded-full mr-4 border"
              />
              <span className="flex-1 font-semibold">{user.name}</span>
              <button
                onClick={() => handleUnblock(user.id)}
                className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition"
              >
                အပိတ်ဖြည်မည် <span className="ml-1 text-xs">(ဖျက်မည်)</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
