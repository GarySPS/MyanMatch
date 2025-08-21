import { useEffect, useState } from "react";
import Card from "../components/Card";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function LikeHistoryPage() {
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingPlus, setCheckingPlus] = useState(true);
  const [isPlus, setIsPlus] = useState(false);

  // Check if current user is Plus
  useEffect(() => {
    async function fetchPlus() {
      setCheckingPlus(true);
      const local = JSON.parse(localStorage.getItem("myanmatch_user") || "{}");
      const userId = local.user_id || local.id;

      if (!userId) {
        setIsPlus(false);
        setCheckingPlus(false);
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("plus")
        .eq("id", userId)
        .single();

      setIsPlus(data?.plus || false);
      setCheckingPlus(false);
    }
    fetchPlus();
  }, []);

  // Fetch like history only if Plus
  useEffect(() => {
    if (!isPlus) return;

    async function fetchLikedProfiles() {
      setLoading(true);

      const local = JSON.parse(localStorage.getItem("myanmatch_user") || "{}");
      const userId = local.user_id || local.id;
      if (!userId) {
        setLikes([]);
        setLoading(false);
        return;
      }

      console.log("Debug LikeHistory → profiles.user_id:", local.user_id, "auth.id:", local.id);

      // Get all likes where current user is the one who liked (from_user_id)
      const { data: likesRows, error: likesErr } = await supabase
        .from("likes")
        .select("to_user_id, created_at")
        .eq("from_user_id", userId)
        .order("created_at", { ascending: false });

      if (likesErr) {
        console.error(likesErr);
        setLikes([]);
        setLoading(false);
        return;
      }
      if (!likesRows || likesRows.length === 0) {
        setLikes([]);
        setLoading(false);
        return;
      }

      // Avoid empty .in([])
      const toUserIds = [...new Set(likesRows.map(l => l.to_user_id).filter(Boolean))];
      if (!toUserIds.length) {
        setLikes([]);
        setLoading(false);
        return;
      }

      // Get profile info for those users
      const { data: profs, error: profErr } = await supabase
        .from("profiles")
        .select("user_id, first_name, age, media")
        .in("user_id", toUserIds);

      if (profErr) {
        console.error(profErr);
        setLikes([]);
        setLoading(false);
        return;
      }

      // Merge data
      const merged = likesRows.map(like => {
        const p = profs.find(u => u.user_id === like.to_user_id);
        const photos = Array.isArray(p?.media)
          ? p.media
          : typeof p?.media === "string" && p.media.startsWith("[")
          ? JSON.parse(p.media)
          : [];
        return {
          id: p?.user_id || like.to_user_id,
          name: p?.first_name || "Unknown",
          age: p?.age || "?",
          avatar_url: photos?.[0] || "/images/avatar.jpg",
          likedAt: like.created_at,
        };
      });

      setLikes(merged);
      setLoading(false);
    }

    fetchLikedProfiles();
  }, [isPlus]);

  if (checkingPlus) return <div className="text-center py-10">Loading...</div>;

  if (!isPlus) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4 text-center">
        <h1 className="text-2xl font-bold mb-6">Who Liked Me</h1>
        <div className="mb-4 text-gray-500">
          This feature is for <span className="font-bold text-gold-700">Plus</span> members only.
        </div>
        <Link to="/PricingPage" className="btn-gold text-lg font-bold">
          Upgrade to Plus to see your likes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Like History</h1>
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : likes.length === 0 ? (
        <div className="text-center text-gray-500">
          You haven't liked anyone yet.
        </div>
      ) : (
        <ul className="space-y-4">
          {likes.map(user => (
            <li key={user.id}>
              <Card>
                <div className="flex items-center">
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-14 h-14 rounded-full border mr-4 object-cover"
                  />
                  <div className="flex-1">
                    <div className="font-semibold">
                      {user.name}, {user.age}
                    </div>
                    <div className="text-sm text-gray-500">
                      Liked at: {new Date(user.likedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
