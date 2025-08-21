// src/components/DetailsGrid.jsx

export default function DetailsGrid({
  age,
  orientation,
  height,
  job,
  education,
  politics,
  location,
  relationship,
  monogamy,
}) {
  return (
    <div className="bg-white rounded-2xl shadow border p-4 grid grid-cols-3 gap-2 text-sm mb-4">
      <div className="flex items-center gap-2 col-span-1"><span role="img" aria-label="age">🎂</span> {age}</div>
      <div className="flex items-center gap-2 col-span-1"><span role="img" aria-label="orientation">🌈</span> {orientation}</div>
      <div className="flex items-center gap-2 col-span-1"><span role="img" aria-label="height">📏</span> {height}</div>
      <div className="flex items-center gap-2 col-span-3"><span role="img" aria-label="job">💼</span> {job}</div>
      <div className="flex items-center gap-2 col-span-3"><span role="img" aria-label="education">🎓</span> {education}</div>
      <div className="flex items-center gap-2 col-span-3"><span role="img" aria-label="politics">🏛️</span> {politics}</div>
      <div className="flex items-center gap-2 col-span-3"><span role="img" aria-label="location">📍</span> {location}</div>
      <div className="flex items-center gap-2 col-span-3"><span role="img" aria-label="relationship">🔍</span> {relationship}</div>
      <div className="flex items-center gap-2 col-span-3"><span role="img" aria-label="monogamy">👥</span> {monogamy}</div>
    </div>
  );
}
