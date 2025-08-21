import { useState } from "react";
import Switch from "../components/Switch";
import Details from "../components/Details";

export default function Notifications() {
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [matchNotifications, setMatchNotifications] = useState(true);
  const [likeNotifications, setLikeNotifications] = useState(true);
  const [appUpdates, setAppUpdates] = useState(false);

  const items = [
    {
      title: "New messages",
      content: "Get notified when you receive new messages.",
      value: messageNotifications,
      setValue: setMessageNotifications,
    },
    {
      title: "New matches",
      content: "Get notified when someone matches with you.",
      value: matchNotifications,
      setValue: setMatchNotifications,
    },
    {
      title: "Likes",
      content: "Get notified when someone likes your profile.",
      value: likeNotifications,
      setValue: setLikeNotifications,
    },
    {
      title: "App updates",
      content: "Receive news and updates about MyanMatch.",
      value: appUpdates,
      setValue: setAppUpdates,
    },
  ];

  return (
    <Details
      title="Notification settings"
      description="Control how you receive notifications from MyanMatch."
      image="/images/profile-notifications.png"
      colorImage="bg-theme-green-100"
    >
      <div className="space-y-8">
        {items.map((item, index) => (
          <div className="flex items-center" key={index}>
            <div className="grow pr-6">
              <div className="text-base-2 font-semibold">{item.title}</div>
              <div className="text-caption-2m text-theme-tertiary">
                {item.content}
              </div>
            </div>
            <Switch
              value={item.value}
              setValue={() => item.setValue(!item.value)}
            />
          </div>
        ))}
      </div>
    </Details>
  );
}
