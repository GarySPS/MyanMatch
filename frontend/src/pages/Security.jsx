import { useState } from "react";
import Field from "../components/Field";
import Switch from "../components/Switch";
import Details from "../components/Details";

export default function Security() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [googleAuthenticator, setGoogleAuthenticator] = useState(true);
  const [emailVerification, setEmailVerification] = useState(false);

  const items = [
    {
      title: "Google Authenticator (2FA)",
      content: "Use Google Authenticator to get verification codes for better security.",
      value: googleAuthenticator,
      setValue: setGoogleAuthenticator,
    },
    {
      title: "E-mail verification (2FA)",
      content: "Receive a code via e-mail for added account security.",
      value: emailVerification,
      setValue: setEmailVerification,
    },
  ];

  return (
    <Details
      title="Security Settings"
      description="For your protection, use a strong password and 2FA. Never share your password with anyone."
      image="/images/profile-security.png"
      colorImage="bg-theme-yellow-100"
    >
      <div>
        <div className="space-y-6">
          <Field
            label="Current password"
            placeholder="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Field
            label="New password"
            placeholder="New password"
            type="password"
            note="Minimum 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Field
            label="Confirm new password"
            placeholder="Confirm new password"
            type="password"
            note="Minimum 6 characters"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button className="btn-secondary mt-8">Update password</button>
      </div>
      <div className="mt-10 space-y-6">
        {items.map((item, index) => (
          <div className="flex items-center" key={index}>
            <div className="grow pr-6">
              <div className="text-base-2">{item.title}</div>
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
