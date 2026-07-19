import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Landmark, ShieldAlert, MapPin, BarChart3 } from "lucide-react";
import { useOutletContext } from "react-router-dom";

// Progress bar component for B2B distributions
const ProgressBarRow = ({ label, percentage }) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-300 font-medium truncate max-w-[200px]" title={label}>{label}</span>
        <span className="text-gray-400 font-semibold">{percentage}%</span>
      </div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#0A66C2] rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default function LinkedInAudience() {
  const { analyticsData } = useOutletContext();
  const demographics = analyticsData?.demographics || {};

  // ── Demographics Data Extraction with B2B Fallbacks ──────────────────
  const jobFunctions = demographics.jobTitles?.map(j => ({
    label: j.name,
    percentage: j.value
  })) || [];

  const companySizes = demographics.companySizes?.map(c => ({
    label: `${c.name} employees`,
    percentage: c.value
  })) || [];

  const industries = demographics.industries?.map(i => ({
    label: i.name,
    percentage: i.value
  })) || [];

  const seniorityLevels = demographics.seniorityLevel || [];

  const locations = demographics.locations || [];

  const cardsConfig = [
    {
      title: "Top Job Functions",
      icon: Briefcase,
      color: "text-blue-400",
      data: jobFunctions
    },
    {
      title: "Company Size Distribution",
      icon: Users,
      color: "text-emerald-400",
      data: companySizes
    },
    {
      title: "Top Industries",
      icon: Landmark,
      color: "text-amber-400",
      data: industries
    },
    {
      title: "Seniority Level Breakdown",
      icon: BarChart3,
      color: "text-violet-400",
      data: seniorityLevels
    },
    {
      title: "Top Locations",
      icon: MapPin,
      color: "text-pink-400",
      data: locations
    }
  ];

  return (
    <div className="animate-fade-in p-6 space-y-6  text-white">
      {/* Overview Intro */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-[#0A66C2]/10 text-[#0A66C2] rounded-full">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-base font-bold">Audience Identity Demographics</h2>
          <p className="text-xs text-gray-400">Professional distribution of your followers and visitors</p>
        </div>
      </div>

      {/* Grid containing demographic lists */}
      <div className="grid gap-6 md:grid-cols-2">
        {cardsConfig.map((card, idx) => (
          <Card key={idx} className={`bg-[#161B22]/90 backdrop-blur-md border border-white/5 text-white shadow-xl ${
            card.title.includes("Locations") ? "md:col-span-2" : ""
          }`}>
            <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center gap-2">
              <card.icon className={`h-4.5 w-4.5 ${card.color}`} />
              <CardTitle className="text-sm font-semibold">{card.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {card.data.length > 0 ? (
                card.data.map((item, i) => (
                  <ProgressBarRow
                    key={i}
                    label={item.label || "Unknown"}
                    percentage={item.percentage || 0}
                  />
                ))
              ) : (
                <div className="py-6 text-center text-xs text-gray-500">
                  Not enough analytical data available yet.
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

