//src>App.jsx
import { Routes, Route } from "react-router-dom";
import { OnboardingProvider } from "./context/OnboardingContext";
import Layout from "./components/Layout";
import OnboardingLayout from "./components/OnboardingLayout";
import ProtectedRoute from "./ProtectedRoute";
import OnboardingRoute from "./OnboardingRoute";
import ProtectedAdminRoute from "./ProtectedAdminRoute";
import AdminDashboard from "./admin/AdminDashboard";
import { I18nProvider } from "./i18n";

import HomePage from "./pages/HomePage";
import WelcomePage from "./pages/WelcomePage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import VerifyCodePage from "./pages/VerifyCodePage";
import VerifyYourIdentityPage from "./pages/VerifyYourIdentityPage";
import OnboardingTermsPage from "./pages/Onboarding/TermsPage";
import LanguageOnboarding from "./pages/Onboarding/LanguageOnboarding";
import NamePage from "./pages/Onboarding/NamePage";
import BirthdatePage from "./pages/Onboarding/BirthdatePage";
import DetailsIntroPage from "./pages/Onboarding/DetailsIntroPage";
import LocationPage from "./pages/Onboarding/LocationPage";
import GenderPage from "./pages/Onboarding/GenderPage";
import SexualityPage from "./pages/Onboarding/SexualityPage";
import InterestedInPage from "./pages/Onboarding/InterestedInPage";
import IntentionPage from "./pages/Onboarding/IntentionPage";
import HeightPage from "./pages/Onboarding/HeightPage";
import EthnicityPage from "./pages/Onboarding/EthnicityPage";
import ChildrenPage from "./pages/Onboarding/ChildrenPage";
import FamilyPlansPage from "./pages/Onboarding/FamilyPlansPage";
import HometownPage from "./pages/Onboarding/HometownPage";
import WorkPage from "./pages/Onboarding/WorkPage";
import JobTitlePage from "./pages/Onboarding/JobTitlePage";
import SchoolPage from "./pages/Onboarding/SchoolPage";
import EducationLevelPage from "./pages/Onboarding/EducationLevelPage";
import ReligionPage from "./pages/Onboarding/ReligionPage";
import PoliticalBeliefPage from "./pages/Onboarding/PoliticalBeliefPage";
import DrinkingPage from "./pages/Onboarding/DrinkingPage";
import SmokingPage from "./pages/Onboarding/SmokingPage";
import WeedPage from "./pages/Onboarding/WeedPage";
import DrugsPage from "./pages/Onboarding/DrugsPage";
import OnboardingMediaPage from "./pages/Onboarding/OnboardingMediaPage";
import ProfilePromptsPage from "./pages/Onboarding/ProfilePromptsPage";
import VoicePromptPage from "./pages/Onboarding/VoicePromptPage";
import FinishPage from "./pages/Onboarding/FinishPage";
import ExplorePage from "./pages/ExplorePage";
import EditProfilePage from "./pages/EditProfilePage";
import DatingPreferencesPage from "./pages/DatingPreferencesPage";
import Profile from "./pages/Profile";
import UserProfilePage from "./pages/UserProfilePage";
import MatchesPage from "./pages/MatchesPage";
import LikeHistoryPage from "./pages/LikeHistoryPage";
import BlockedUsersPage from "./pages/BlockedUsersPage";
import Notifications from "./pages/Notifications";
import PricingPage from "./pages/PricingPage";
import DeleteAccount from "./pages/DeleteAccount";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import NotFoundPage from "./pages/NotFoundPage";
import ChatPage from "./pages/ChatPage";
import MarketPage from "./pages/MarketPage";
import ChatThread from "./pages/ChatThread";
import ChangePassword from "./pages/ChangePassword";
import Language from "./pages/Language";
import AccountSecurityPage from "./pages/AccountSecurityPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DownloadPage from "./pages/Download";

const publicRoutes = [
  { path: "/", element: <WelcomePage /> },
  { path: "/SignInPage", element: <SignInPage /> },
  { path: "/SignUpPage", element: <SignUpPage /> },
  { path: "/VerifyCodePage", element: <VerifyCodePage /> },
  { path: "/VerifyYourIdentityPage", element: <VerifyYourIdentityPage /> },
];

const onboardingRoutes = [
  { path: "/onboarding/terms", element: <OnboardingTermsPage /> },
  { path: "/onboarding/language", element: <LanguageOnboarding /> },
  { path: "/onboarding/name", element: <NamePage /> },
  { path: "/onboarding/birthdate", element: <BirthdatePage /> },
  { path: "/onboarding/details-intro", element: <DetailsIntroPage /> },
  { path: "/onboarding/location", element: <LocationPage /> },
  { path: "/onboarding/gender", element: <GenderPage /> },
  { path: "/onboarding/sexuality", element: <SexualityPage /> },
  { path: "/onboarding/interested-in", element: <InterestedInPage /> },
  { path: "/onboarding/intention", element: <IntentionPage /> },
  { path: "/onboarding/height", element: <HeightPage /> },
  { path: "/onboarding/ethnicity", element: <EthnicityPage /> },
  { path: "/onboarding/children", element: <ChildrenPage /> },
  { path: "/onboarding/family-plans", element: <FamilyPlansPage /> },
  { path: "/onboarding/hometown", element: <HometownPage /> },
  { path: "/onboarding/work", element: <WorkPage /> },
  { path: "/onboarding/job-title", element: <JobTitlePage /> },
  { path: "/onboarding/school", element: <SchoolPage /> },
  { path: "/onboarding/education-level", element: <EducationLevelPage /> },
  { path: "/onboarding/religion", element: <ReligionPage /> },
  { path: "/onboarding/political-belief", element: <PoliticalBeliefPage /> },
  { path: "/onboarding/drinking", element: <DrinkingPage /> },
  { path: "/onboarding/smoking", element: <SmokingPage /> },
  { path: "/onboarding/weed", element: <WeedPage /> },
  { path: "/onboarding/drugs", element: <DrugsPage /> },
  { path: "/onboarding/media", element: <OnboardingMediaPage /> },
  { path: "/onboarding/profile-prompts", element: <ProfilePromptsPage /> },
  { path: "/onboarding/voice-prompt", element: <VoicePromptPage /> },
  { path: "/onboarding/finish", element: <FinishPage /> },
];

const protectedRoutes = [
  { path: "/HomePage", element: <HomePage /> },
  { path: "/ExplorePage", element: <ExplorePage /> },
  { path: "/EditProfilePage", element: <EditProfilePage /> },
  { path: "/Profile", element: <Profile /> },
  { path: "/me", element: <UserProfilePage /> },
  { path: "/profile/:id", element: <UserProfilePage /> },
  { path: "/MatchesPage", element: <MatchesPage /> },
  { path: "/LikeHistoryPage", element: <LikeHistoryPage /> },
  { path: "/BlockedUsersPage", element: <BlockedUsersPage /> },
  { path: "/Notifications", element: <Notifications /> },
  { path: "/PricingPage", element: <PricingPage /> },
  { path: "/DeleteAccount", element: <DeleteAccount /> },
  { path: "/PrivacyPage", element: <PrivacyPage /> },
  { path: "/TermsPage", element: <TermsPage /> },
  { path: "/ChatPage", element: <ChatPage /> },
  { path: "/chat/:userId", element: <ChatThread /> },
  { path: "/settings/preferences", element: <DatingPreferencesPage /> },
  { path: "/MarketPage", element: <MarketPage /> },
  { path: "/settings/language", element: <Language /> },
  { path: "/ChangePassword", element: <ChangePassword /> },
  { path: "/AccountSecurityPage", element: <AccountSecurityPage /> },
  { path: "/ForgotPasswordPage", element: <ForgotPasswordPage /> },
];

export default function App() {
  return (
    <I18nProvider>
      <OnboardingProvider>
        <Routes>
          {/* Public routes that anyone can see */}
          {publicRoutes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}

          {/* Onboarding routes */}
          {onboardingRoutes.map(({ path, element }) => (
            <Route
              key={path}
              path={path}
              element={
                <OnboardingRoute>
                  <OnboardingLayout>{element}</OnboardingLayout>
                </OnboardingRoute>
              }
            />
          ))}

          {/* Protected routes - FIXED: Layout inside ProtectedRoute */}
          {protectedRoutes.map(({ path, element }) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute>
                  <Layout>{element}</Layout>
                </ProtectedRoute>
              }
            />
          ))}

          {/* Admin Route */}
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />

          <Route path="/Download" element={<DownloadPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </OnboardingProvider>
    </I18nProvider>
  );
}