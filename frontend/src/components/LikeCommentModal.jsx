import { useState } from "react";

export default function LikeCommentModal({ open, onClose, onSend }) {
  const [comment, setComment] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-80">
        <div className="mb-2 text-lg font-bold">Send a Comment?</div>
        <textarea
          className="w-full border rounded-xl p-2 mb-4"
          rows={3}
          placeholder="Say something about this profile (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <div className="flex justify-between gap-2">
          <button className="btn-neutral flex-1" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary flex-1"
            onClick={() => {
              onSend(comment);
              setComment("");
            }}
          >
            Send Like
          </button>
        </div>
      </div>
    </div>
  );
}
