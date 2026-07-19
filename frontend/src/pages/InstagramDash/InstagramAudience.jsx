import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import igapi from '@/services/igapi';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US', {
    notation: "compact",
    compactDisplay: "short"
  }).format(num);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'rgba(22, 27, 34, 0.85)',
        backdropFilter: 'blur(12px)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: '1px',
        color: '#fff',
        borderRadius: '8px',
        padding: '12px'
      }}>
        {label && <p className="font-semibold text-gray-200 mb-2">{label}</p>}
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm mb-1 last:mb-0">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
            <span className="text-gray-400 capitalize">{entry.name}:</span>
            <span className="font-medium text-white">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const COLORS = ['#E1306C', '#833AB4', '#F77737', '#FCAF45', '#405DE6'];

const InstagramAudience = () => {
  const { isConnected } = useOutletContext();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const response = await igapi.getAudience();
        if (isMounted) setData(response);
      } catch (error) {
        console.error("Failed to fetch audience data:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    if (isConnected) fetchData();
    else setIsLoading(false);
    return () => { isMounted = false; };
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-xl text-white font-semibold mb-2">Account Disconnected</h2>
        <p className="text-gray-400">Please connect your Instagram account to view audience metrics.</p>
      </div>
    );
  }

  const hasData = data && (
    (data.demographics.topCountries && data.demographics.topCountries.length > 0) ||
    (data.demographics.ageRange && data.demographics.ageRange.length > 0) ||
    (data.demographics.gender && data.demographics.gender.some(g => g.value > 0))
  );

  return (
    <div className="p-4 md:p-8 space-y-6 w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Audience Demographics</h1>
          <p className="text-sm text-gray-400 mt-1">Deep dive into your followers and engagement</p>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[280px] w-full bg-gray-700/30 rounded-xl" />
          <Skeleton className="h-[280px] w-full bg-gray-700/30 rounded-xl" />
          <Skeleton className="h-[280px] w-full bg-gray-700/30 rounded-xl" />
        </div>
      ) : !hasData ? (
        <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5 shadow-sm text-center py-16">
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-2">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white">Not Enough Data</h3>
            <p className="text-gray-400 max-w-md text-sm leading-relaxed">
              Instagram's Graph API requires a minimum of <strong className="text-white">100 followers</strong> to provide audience demographics (age, gender, locations) in order to protect user privacy. 
              Keep growing your audience, and insights will appear here automatically!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gender Donut */}
          <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Gender Split</CardTitle>
            </CardHeader>
            <CardContent className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.demographics.gender}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="type"
                    stroke="none"
                  >
                    {data.demographics.gender.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Age Distribution Bar */}
          <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Age Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.demographics.ageRange} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="age" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="value" fill="#E1306C" radius={[4, 4, 0, 0]} name="Percentage" barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Countries/Cities */}
          <Card className="bg-[#161B22]/90 backdrop-blur-md rounded-xl border border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Top Locations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Countries</h4>
                <div className="space-y-3">
                  {data.demographics.topCountries.slice(0, 3).map((country) => (
                    <div key={country.name} className="flex items-center gap-3">
                      <span className="text-sm text-gray-300 w-24 truncate">{country.name}</span>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#833AB4] rounded-full"
                          style={{ width: `${country.value}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 font-medium w-8 text-right">{country.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {data.demographics.topCities && data.demographics.topCities.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Cities</h4>
                  <div className="space-y-3">
                    {data.demographics.topCities.slice(0, 3).map((city) => (
                      <div key={city.name} className="flex items-center gap-3">
                        <span className="text-sm text-gray-300 w-24 truncate">{city.name}</span>
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#F77737] rounded-full"
                            style={{ width: `${city.value}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 font-medium w-8 text-right">{city.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InstagramAudience;
