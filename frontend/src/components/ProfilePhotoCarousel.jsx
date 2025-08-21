import { useState } from "react";

export default function ProfilePhotoCarousel({ photos = [] }) {
  const [index, setIndex] = useState(0);

  if (!photos.length) return null;

  const prev = () => setIndex((i) => (i > 0 ? i - 1 : i));
  const next = () => setIndex((i) => (i < photos.length - 1 ? i + 1 : i));

  return (
    <div className="relative mb-4">
      <img
        src={photos[index]}
        alt={`Profile photo ${index + 1}`}
        className="w-full rounded-2xl object-cover aspect-square"
      />
      {/* Dots indicator */}
      {photos.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
          {photos.map((_, i) => (
            <span
              key={i}
              className={`inline-block w-2 h-2 rounded-full transition-all duration-300 ${i === index ? "bg-theme-primary" : "bg-gray-300"}`}
            />
          ))}
        </div>
      )}
      {/* Simple arrows for demo */}
      {index > 0 && (
        <button
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 rounded-full p-1"
          onClick={prev}
        >◀️</button>
      )}
      {index < photos.length - 1 && (
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 rounded-full p-1"
          onClick={next}
        >▶️</button>
      )}
    </div>
  );
}
