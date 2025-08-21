import Layout from "../components/Layout";

export default function PrivacyPage() {
  return (
    <Layout title="Privacy Policy">
      <div className="max-w-2xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
        <p className="mb-4">
          MyanMatch values your privacy. We only collect the information needed to provide and improve our service.
        </p>
        <h2 className="text-lg font-semibold mt-6 mb-2">What we collect</h2>
        <ul className="list-disc ml-6 mb-4">
          <li>Name and basic profile info</li>
          <li>Profile photos and prompts</li>
          <li>Email address</li>
          <li>Usage and match data</li>
        </ul>
        <h2 className="text-lg font-semibold mt-6 mb-2">How we use your information</h2>
        <ul className="list-disc ml-6 mb-4">
          <li>To match you with relevant users</li>
          <li>To improve safety and prevent abuse</li>
          <li>To contact you with updates</li>
        </ul>
        <p className="mt-4">
          Your data will never be sold or shared except as needed to operate the app or comply with the law.
        </p>
        <p className="mt-4 text-gray-500">
          Please contact us at support@myanmatch.com for any privacy questions.
        </p>
      </div>
    </Layout>
  );
}
