// ── Navbar Component ────────────────────────────────────────────────
// Top navigation bar for the dashboard. Shows the current page title,
// a theme toggle button, and search placeholder.

import { useTheme } from "@/context/ThemeContext";
import { Moon, Sun, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Navbar({ title = "Dashboard" }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-background text-white px-6">
      {/* ── Page Title ────────────────────────────────────────────────── */}
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>

      {/* ── Right-side Actions ────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* ── Notifications Button (placeholder) ──────────────────────── */}
        <Link to="/notifications">
          <Button variant="ghost" size="icon" id="navbar-notifications-btn">
            <Bell className="h-4 w-4" />
          </Button>
        </Link>

        {/* ── Theme Toggle ──────────────────────────────────────────────── */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          id="navbar-theme-toggle"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="h-4 w-4 transition-transform duration-300" />
          ) : (
            <Moon className="h-4 w-4 transition-transform duration-300" />
          )}
        </Button>
      </div>
    </header>
  );
}
