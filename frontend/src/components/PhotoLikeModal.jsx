// src/components/PhotoLikeModal.jsx
export default function PhotoLikeModal({
  open,
  photo,
  name,
  onClose,
  onSuperlike, // SEND GIFT
}) {
  if (!open) return null;

  const handleSendGift = () => {
    onSuperlike?.(); // open Gift picker in HomePage
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-4">
        {/* Name */}
        <div className="text-xl font-bold mb-4">{name}</div>

        {/* Photo */}
        <div className="w-full aspect-square rounded-2xl overflow-hidden mb-6">
          <img
            src={photo}
            alt=""
            className="object-cover w-full h-full"
            draggable={false}
          />
        </div>

        {/* Actions */}
        <button
          className="w-full bg-[#f5e8fa] text-[#a259c3] py-3 rounded-xl font-bold mb-2"
          onClick={handleSendGift}
        >
          🎁 Send Gift
        </button>

        <button
          className="block w-full text-gray-400 hover:text-gray-700 text-base font-medium"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
