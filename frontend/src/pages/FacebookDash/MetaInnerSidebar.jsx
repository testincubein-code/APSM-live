// ── Meta Inner Sidebar ──────────────────────────────────────────────
// Reusable vertical sidebar for Facebook & Instagram dashboards.
// Accepts nav items, accent color, platform icon, active tab state,
// and an isConnected flag that controls nav link visibility.
//
// Layout behaviour:
//   • The <aside> and Platform Switcher are ALWAYS rendered so the
//     user can toggle between Facebook and Instagram regardless of
//     connection status.
//   • The nav link list is ONLY mounted when isConnected === true.
//   • When not connected, the sidebar narrows to a slim strip (w-20)
//     so the main content area (ConnectPrompt) fills the remaining space.
//   • When connected and not collapsed the sidebar is full-width (w-64).

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Facebook, Instagram } from "@/components/icons/BrandIcons";
import {
  BarChart3, Users, Heart, FileText,
  PanelLeftClose, PanelLeft,
  ThumbsUp, Eye, Video, History, Target, Settings, HelpCircle,
  PlaySquare, TrendingUp, Hash,
} from "lucide-react";

// ── Nav item configs per platform ───────────────────────────────────
export const FB_NAV = [
  { id: "overview",    label: "Overview",     icon: BarChart3   },
  { id: "content",     label: "Content",      icon: FileText    },
  { id: "audience",    label: "Audience",     icon: Users       },
  { id: "engagement",  label: "Engagement",   icon: Heart       },
  { id: "page_likes",  label: "Page Likes",   icon: ThumbsUp    },
  { id: "reach_views", label: "Reach & Views",icon: Eye         },
  { id: "videos",      label: "Videos",       icon: Video       },
  { id: "stories",     label: "Stories",      icon: History     },
  { id: "groups",      label: "Groups",       icon: Users       },
  { id: "ads",         label: "Ads",          icon: Target      },
  { id: "reports",     label: "Reports",      icon: FileText    },
  { id: "insights",    label: "Insights",     icon: BarChart3   },
  { id: "settings",    label: "Settings",     icon: Settings    },
  { id: "help",        label: "Help",         icon: HelpCircle  },
];

export const IG_NAV = [
  { id: "overview",   label: "Overview",   icon: BarChart3  },
  { id: "content",    label: "Content",    icon: FileText   },
  { id: "audience",   label: "Audience",   icon: Users      },
  { id: "engagement", label: "Engagement", icon: Heart      },
  { id: "stories",    label: "Stories",    icon: History    },
  { id: "reels",      label: "Reels",      icon: PlaySquare },
  { id: "growth",     label: "Growth",     icon: TrendingUp },
  { id: "hashtags",   label: "Hashtags",   icon: Hash       },
  { id: "ads",        label: "Ads",        icon: Target     },
  { id: "insights",   label: "Insights",   icon: BarChart3  },
  { id: "reports",    label: "Reports",    icon: FileText   },
  { id: "settings",   label: "Settings",   icon: Settings   },
  { id: "help",       label: "Help",       icon: HelpCircle },
];

export default function MetaInnerSidebar({
  navItems,
  activeTab,
  onTabChange,
  platformIcon: PlatformIcon,
  platformLabel,
  accentColor = "blue",   // "blue" | "pink"
  isConnected = false,
}) {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();

  // Collapse state only matters when connected (nav links are visible).
  // When not connected the sidebar auto-collapses to its slim strip.
  const [collapsedByUser, setCollapsedByUser] = useState(false);

  // ── Derived state ────────────────────────────────────────────────
  // When not connected → always show the slim icon-only strip (w-20).
  // When connected → honour the user's collapsed preference.
  const isSlim = !isConnected || collapsedByUser;

  const isFacebook  = location.pathname.includes("facebook");
  const isInstagram = location.pathname.includes("instagram");

  // ── Accent token helpers ─────────────────────────────────────────
  const activeBg     = accentColor === "pink" ? "bg-pink-500/10"  : "bg-blue-500/10";
  const activeText   = accentColor === "pink" ? "text-pink-500"   : "text-blue-500";
  const activeBorder = accentColor === "pink" ? "border-pink-500" : "border-blue-500";
  const hoverBg      = accentColor === "pink" ? "hover:bg-pink-500/5"  : "hover:bg-blue-500/5";
  const hoverText    = accentColor === "pink" ? "hover:text-pink-400"  : "hover:text-blue-400";

  return (
    <aside
      className={`
        flex-shrink-0 flex flex-col h-full
        overflow-y-auto bg-background/95 backdrop-blur-xl
        transition-all duration-300 z-40 custom-scrollbar
        ${isSlim ? "w-20" : "w-64"}
      `}
    >
      {/* ── Platform Header ─────────────────────────────────────── */}
      {/* Always visible — shows platform icon + label + collapse toggle */}
      <div className="h-16 flex items-center justify-between px-4 flex-shrink-0">
        {/* Platform label — hidden in slim/collapsed mode */}
        <div className={`flex items-center gap-3 overflow-hidden transition-opacity ${isSlim ? "opacity-0 w-0" : "opacity-100"}`}>
          <div className={`p-1.5 rounded-lg ${activeBg}`}>
            <PlatformIcon className={`h-5 w-5 ${activeText}`} />
          </div>
          <span className="font-semibold text-white truncate">{platformLabel}</span>
        </div>

        {/* Collapse toggle — only shown when connected (no nav to collapse otherwise) */}
        {isConnected && (
          <button
            onClick={() => setCollapsedByUser(!collapsedByUser)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            title={collapsedByUser ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsedByUser
              ? <PanelLeft className="h-5 w-5" />
              : <PanelLeftClose className="h-5 w-5" />
            }
          </button>
        )}
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-4 custom-scrollbar">

        {/* ── Platform Switcher ──────────────────────────────────── */}
        {/* ALWAYS rendered — user must be able to switch FB ↔ IG   */}
        {/* regardless of whether either account is connected.        */}
        {isSlim ? (
          // Icon-only switcher for slim/collapsed state
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => navigate('/dashboard/facebook')}
              className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                isFacebook ? "bg-[#1877F2] text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
              title="Facebook"
            >
              <Facebook className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate('/dashboard/instagram')}
              className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                isInstagram ? "bg-[#E1306C] text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
              title="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </button>
          </div>
        ) : (
          // Full-width pill switcher for expanded state
          <div className="bg-white/5 p-1 rounded-lg flex gap-1">
            <button
              onClick={() => navigate('/dashboard/facebook')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-sm font-medium transition-all ${
                isFacebook
                  ? "bg-[#1877F2] text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Facebook className="h-4 w-4" /> Facebook
            </button>
            <button
              onClick={() => navigate('/dashboard/instagram')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-sm font-medium transition-all ${
                isInstagram
                  ? "bg-[#E1306C] text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Instagram className="h-4 w-4" /> Instagram
            </button>
          </div>
        )}

        {/* ── Navigation Links ───────────────────────────────────── */}
        {/* Only mounted after a successful OAuth connection.          */}
        {isConnected && (
          <div className="flex flex-col h-full">
            <nav className="flex flex-col space-y-1 flex-1">
              {navItems.filter(item => item.id !== 'settings' && item.id !== 'help').map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                      transition-all duration-200 group relative
                      ${isActive
                        ? `${activeBg} ${activeText} font-medium`
                        : `text-slate-400 ${hoverBg} ${hoverText}`}
                      ${isSlim ? "justify-center" : ""}
                    `}
                    title={isSlim ? item.label : undefined}
                  >
                    {/* Active left-border accent */}
                    {isActive && !isSlim && (
                      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full ${activeBorder}`} />
                    )}
                    <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? activeText : "text-slate-500 group-hover:text-slate-300"}`} />
                    {/* Label hidden when slim/collapsed */}
                    {!isSlim && (
                      <span className="truncate text-sm">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="mt-auto pt-4 border-t border-white/10 flex flex-col gap-1">
              {navItems.filter(item => item.id === 'settings' || item.id === 'help').map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'settings') navigate(`/dashboard/${isFacebook ? 'facebook' : 'instagram'}/settings`);
                      else if (item.id === 'help') navigate(`/dashboard/${isFacebook ? 'facebook' : 'instagram'}/help`);
                      else onTabChange(item.id);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                      transition-all duration-200 group relative
                      ${isActive
                        ? `${activeBg} ${activeText} font-medium`
                        : `text-slate-400 ${hoverBg} ${hoverText}`}
                      ${isSlim ? "justify-center" : ""}
                    `}
                    title={isSlim ? item.label : undefined}
                  >
                    {/* Active left-border accent */}
                    {isActive && !isSlim && (
                      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full ${activeBorder}`} />
                    )}
                    <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? activeText : "text-slate-500 group-hover:text-slate-300"}`} />
                    {/* Label hidden when slim/collapsed */}
                    {!isSlim && (
                      <span className="truncate text-sm">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

