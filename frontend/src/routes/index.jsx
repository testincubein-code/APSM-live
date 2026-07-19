// ── Client-Side Route Configuration ─────────────────────────────────
// Defines all application routes using react-router-dom.
// Dashboard routes are wrapped in a layout shell with Sidebar + Navbar.

import { createBrowserRouter, Navigate } from "react-router-dom";

// ── Page Imports ────────────────────────────────────────────────────
import LandingPage from "@/pages/LandingPage/LandingPage";
import AuthPage from "@/pages/Auth/AuthPage";
import YoutubeLayout from "@/pages/YoutubeDash/YoutubeLayout";
import YoutubeOverview from "@/pages/YoutubeDash/YoutubeOverview";
import YoutubeContent from "@/pages/YoutubeDash/YoutubeContent";
import YoutubeAudience from "@/pages/YoutubeDash/YoutubeAudience";
import YoutubeEngagement from "@/pages/YoutubeDash/YoutubeEngagement";
import YoutubePlaylists from "@/pages/YoutubeDash/YoutubePlaylists";
import YoutubeRevenue from "@/pages/YoutubeDash/YoutubeRevenue";
import YoutubeRealtime from "@/pages/YoutubeDash/YoutubeRealtime";
import YoutubeReports from "@/pages/YoutubeDash/YoutubeReports";
import YoutubeSettings from "@/pages/YoutubeDash/YoutubeSettings";
import YoutubeHelp from "@/pages/YoutubeDash/YoutubeHelp";
import LinkedInLayout from "@/pages/LinkedInDash/LinkedInLayout";
import LinkedInOverview from "@/pages/LinkedInDash/LinkedInOverview";
import LinkedInContent from "@/pages/LinkedInDash/LinkedInContent";
import LinkedInAudience from "@/pages/LinkedInDash/LinkedInAudience";
import LinkedInEngagement from "@/pages/LinkedInDash/LinkedInEngagement";
import LinkedInGrowth from "@/pages/LinkedInDash/LinkedInGrowth";
import LinkedInReports from "@/pages/LinkedInDash/LinkedInReports";
import LinkedInSettings from "@/pages/LinkedInDash/LinkedInSettings";
import LinkedInHelp from "@/pages/LinkedInDash/LinkedInHelp";
import FacebookLayout from "@/pages/FacebookDash/FacebookLayout";
import FacebookDash from "@/pages/FacebookDash/FacebookDash";
import FacebookContent from "@/pages/FacebookDash/FacebookContent";
import FacebookAudience from "@/pages/FacebookDash/FacebookAudience";
import FacebookEngagement from "@/pages/FacebookDash/FacebookEngagement";
import FacebookPageLikes from "@/pages/FacebookDash/FacebookPageLikes";
import FacebookReachViews from "@/pages/FacebookDash/FacebookReachViews";
import FacebookVideos from "@/pages/FacebookDash/FacebookVideos";
import FacebookStories from "@/pages/FacebookDash/FacebookStories";
import FacebookGroups from "@/pages/FacebookDash/FacebookGroups";
import FacebookAds from "@/pages/FacebookDash/FacebookAds";
import FacebookReports from "@/pages/FacebookDash/FacebookReports";
import FacebookInsights from "@/pages/FacebookDash/FacebookInsights";
import FacebookSettings from "@/pages/FacebookDash/FacebookSettings";
import FacebookHelp from "@/pages/FacebookDash/FacebookHelp";
import InstagramDash from "@/pages/InstagramDash/InstagramDash";
import InstagramLayout from "@/pages/InstagramDash/InstagramLayout";
import MetricDetailView from "@/pages/InstagramDash/MetricDetailView";
import InstagramContent from "@/pages/InstagramDash/InstagramContent";
import InstagramAudience from "@/pages/InstagramDash/InstagramAudience";
import InstagramEngagement from "@/pages/InstagramDash/InstagramEngagement";
import InstagramStories from "@/pages/InstagramDash/InstagramStories";
import InstagramReels from "@/pages/InstagramDash/InstagramReels";
import InstagramGrowth from "@/pages/InstagramDash/InstagramGrowth";
import InstagramHashtags from "@/pages/InstagramDash/InstagramHashtags";
import InstagramInsights from "@/pages/InstagramDash/InstagramInsights";
import InstagramReports from "@/pages/InstagramDash/InstagramReports";
import InstagramSettings from "@/pages/InstagramDash/InstagramSettings";
import InstagramHelp from "@/pages/InstagramDash/InstagramHelp";
import CrossPostingDash from "@/pages/CrossPostingDash/CrossPostingDash";
import NewPostPage from "@/pages/CrossPostingDash/NewPostPage";
import CrossPostHistory from "@/pages/CrossPostingDash/CrossPostHistory";
import CrossPostLayout from "@/pages/CrossPostingDash/CrossPostLayout";
import CombinedOverview from "@/pages/CombinedOverview/CombinedOverview";
import NotFound from "@/pages/NotFound/NotFound";
import Settings from "@/pages/Settings";

// ── Layout & Guard Imports ──────────────────────────────────────────
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

import { useOutletContext } from "react-router-dom";

// ── Context Wrapper for Legacy Props ────────────────────────────────
// Passes useOutletContext values as props to components that still expect them.
const YoutubeContextWrapper = ({ Component }) => {
  const context = useOutletContext();
  return <Component {...context} />;
};

// ── Router Definition ───────────────────────────────────────────────
const router = createBrowserRouter([
  // ── Public Routes ─────────────────────────────────────────────────
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <AuthPage /> },
  { path: "/signup", element: <AuthPage /> },
  { path: "/settings", element: <ProtectedRoute><Settings /></ProtectedRoute> },

  // ── Dashboard Routes (wrapped in layout shell) ────────────────────
  {
    path: "/dashboard",
    element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/dashboard/combined" replace /> },
      { path: "combined", element: <CombinedOverview /> },
      {
        path: "youtube",
        element: <YoutubeLayout />,
        children: [
          { index: true, element: <YoutubeContextWrapper Component={YoutubeOverview} /> },
          { path: "content", element: <YoutubeContextWrapper Component={YoutubeContent} /> },
          { path: "audience", element: <YoutubeContextWrapper Component={YoutubeAudience} /> },
          { path: "engagement", element: <YoutubeContextWrapper Component={YoutubeEngagement} /> },
          { path: "playlists", element: <YoutubeContextWrapper Component={YoutubePlaylists} /> },
          { path: "revenue", element: <YoutubeContextWrapper Component={YoutubeRevenue} /> },
          { path: "realtime", element: <YoutubeContextWrapper Component={YoutubeRealtime} /> },
          { path: "reports", element: <YoutubeContextWrapper Component={YoutubeReports} /> },
          { path: "settings", element: <YoutubeSettings /> },
          { path: "help", element: <YoutubeHelp /> },
        ]
      },
      {
        path: "linkedin",
        element: <LinkedInLayout />,
        children: [
          { index: true, element: <LinkedInOverview /> },
          { path: "content", element: <LinkedInContent /> },
          { path: "audience", element: <LinkedInAudience /> },
          { path: "engagement", element: <LinkedInEngagement /> },
          { path: "growth", element: <LinkedInGrowth /> },
          { path: "reports", element: <LinkedInReports /> },
          { path: "settings", element: <LinkedInSettings /> },
          { path: "help", element: <LinkedInHelp /> },
        ]
      },
      // ── Facebook Dashboard — nested layout with child routes ──────
      // Mirrors the Instagram routing architecture exactly:
      // FacebookLayout = sidebar shell + Outlet
      // FacebookDash   = Overview index child page only
      {
        path: "facebook",
        element: <FacebookLayout />,
        children: [
          { index: true, element: <FacebookDash /> },
          { path: "content", element: <FacebookContent /> },
          { path: "audience", element: <FacebookAudience /> },
          { path: "engagement", element: <FacebookEngagement /> },
          { path: "page_likes", element: <FacebookPageLikes /> },
          { path: "reach_views", element: <FacebookReachViews /> },
          { path: "videos", element: <FacebookVideos /> },
          { path: "stories", element: <FacebookStories /> },
          { path: "groups", element: <FacebookGroups /> },
          { path: "ads", element: <FacebookAds /> },
          { path: "reports", element: <FacebookReports /> },
          { path: "insights", element: <FacebookInsights /> },
          { path: "settings", element: <FacebookSettings /> },
          { path: "help", element: <FacebookHelp /> },
        ]
      },
      {
        path: "instagram",
        element: <InstagramLayout />,
        children: [
          { index: true, element: <InstagramDash /> },
          { path: "content", element: <InstagramContent /> },
          { path: "audience", element: <InstagramAudience /> },
          { path: "engagement", element: <InstagramEngagement /> },
          { path: "stories", element: <InstagramStories /> },
          { path: "reels", element: <InstagramReels /> },
          { path: "growth", element: <InstagramGrowth /> },
          { path: "hashtags", element: <InstagramHashtags /> },
          { path: "insights", element: <InstagramInsights /> },
          { path: "reports", element: <InstagramReports /> },
          { path: "settings", element: <InstagramSettings /> },
          { path: "help", element: <InstagramHelp /> },
          { path: "metrics/:metricId", element: <MetricDetailView /> }
        ]
      },
      {
        path: "crosspost",
        element: <CrossPostLayout />,
        children: [
          { index: true, element: <CrossPostingDash /> },
          { path: "new", element: <NewPostPage /> },
          { path: "history", element: <CrossPostHistory /> },
        ]
      },
    ],
  },

  // ── 404 Catch-All ─────────────────────────────────────────────────
  { path: "*", element: <NotFound /> },
]);

export default router;
