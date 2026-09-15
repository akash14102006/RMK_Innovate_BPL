import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar as CalendarIcon, TrendingUp, Users, AlertCircle, Wifi, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchFestivalsFromAPI, getFestivalsByMonth, isFestivalServiceConfigured, Festival, getNextMajorFestival, INDIAN_FESTIVALS_2026 } from '../services/festivalService';
import { toast } from 'sonner';

export default function FestivalCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth()); // Month being viewed
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [allYearFestivals, setAllYearFestivals] = useState<Festival[]>([]);
  const [upcomingFestivals, setUpcomingFestivals] = useState<any[]>([]);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const today = currentDate.getDate();
  const currentMonth = currentDate.getMonth(); // 0-based (0 = January, 9 = October)
  const currentYear = currentDate.getFullYear();

  // Get month name
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const currentMonthName = monthNames[currentMonth];
  const viewMonthName = monthNames[viewMonth];

  // Fetch festivals from API for the viewed month
  const loadFestivals = async () => {
    setIsLoading(true);
    try {
      const isConfigured = isFestivalServiceConfigured();
      setIsLiveMode(isConfigured);

      if (isConfigured) {
        const fetchedFestivals = await fetchFestivalsFromAPI(viewYear);
        setAllYearFestivals(fetchedFestivals);

        const viewMonthFestivals = fetchedFestivals.filter(f => f.month === viewMonth + 1 && f.year === viewYear);
        setFestivals(viewMonthFestivals);

        // Derive upcoming festivals for the next 60 days
        const now = new Date();
        const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
        const upcoming = fetchedFestivals
          .filter(f => {
            const fDate = new Date(f.date);
            return fDate >= now && fDate <= sixtyDaysFromNow;
          })
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 4)
          .map(f => ({
            name: f.name,
            date: new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            surge: f.surge,
            region: f.region
          }));

        setUpcomingFestivals(upcoming);

        toast.success('Live festival data loaded', {
          description: `${fetchedFestivals.length} festivals from Calendarific API`
        });
      } else {
        const viewMonthFestivals = getFestivalsByMonth(viewMonth + 1, viewYear);
        setFestivals(viewMonthFestivals);

        // Fallback upcoming from static data
        const upcoming = INDIAN_FESTIVALS_2026
          .filter(f => new Date(f.date) >= new Date())
          .slice(0, 4)
          .map(f => ({
            name: f.name,
            date: new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            surge: f.surge,
            region: f.region
          }));
        setUpcomingFestivals(upcoming);
      }
    } catch (error) {
      console.error('Error loading festivals:', error);
      const viewMonthFestivals = getFestivalsByMonth(viewMonth + 1, viewYear);
      setFestivals(viewMonthFestivals);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  // Navigate to next month
  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Go to current month
  const goToCurrentMonth = () => {
    setViewMonth(currentMonth);
    setViewYear(currentYear);
  };

  // Load festivals when month/year changes
  useEffect(() => {
    loadFestivals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMonth, viewYear]);

  // Update current date every day
  useEffect(() => {
    const updateDate = () => {
      setCurrentDate(new Date());
    };

    // Update immediately
    updateDate();

    // Update at midnight every day
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    const timeoutId = setTimeout(() => {
      updateDate();
      // Then update every 24 hours
      const intervalId = setInterval(updateDate, 24 * 60 * 60 * 1000);
      return () => clearInterval(intervalId);
    }, timeUntilMidnight);

    return () => clearTimeout(timeoutId);
  }, []);

  // State handles upcomingFestivals now

  const getSurgeBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge className="bg-red-500">High Impact</Badge>;
      case 'moderate':
        return <Badge className="bg-yellow-500">Moderate</Badge>;
      case 'low':
        return <Badge className="bg-green-500">Low Impact</Badge>;
      default:
        return null;
    }
  };

  // Calculate days until Diwali (Nov 8)
  const diwaliDate = new Date(2026, 10, 8); // Month is 0-based (November is 10)
  const daysUntilDiwali = Math.ceil((diwaliDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilDiwaliDisplay = daysUntilDiwali > 0 ? daysUntilDiwali : 0;

  // Get next major festival for dynamic preparation checklist
  const nextFestival = getNextMajorFestival();
  const upcomingHighImpactFestivals = INDIAN_FESTIVALS_2026.filter(f => {
    const festDate = new Date(f.date);
    const diff = festDate.getTime() - currentDate.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 && days <= 30 && (f.level === 'high' || f.level === 'moderate');
  }).slice(0, 1)[0];

  const targetFestival = upcomingHighImpactFestivals || nextFestival;

  // Calculate days until target festival
  const daysUntilFestival = targetFestival ? Math.ceil((new Date(targetFestival.date).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const daysUntilFestivalDisplay = daysUntilFestival > 0 ? daysUntilFestival : 0;

  // Format festival date for display
  const formatFestivalDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Generate festival-specific checklist items
  const getChecklistItems = (festival: Festival | null) => {
    if (!festival) {
      return {
        staffing: [
          { task: 'Maintain regular staffing', completed: true },
          { task: 'On-call roster updated', completed: true },
        ],
        supplies: [
          { task: 'Regular inventory check', completed: true },
          { task: 'Standard supply levels', completed: true },
        ],
        infrastructure: [
          { task: 'Routine maintenance', completed: false },
          { task: 'Equipment testing', completed: false },
        ],
      };
    }

    const baseStaffing = [
      { task: `Schedule +${festival.level === 'high' ? '16' : '8'} nurses`, completed: true },
      { task: `Deploy ${festival.level === 'high' ? '4' : '2'} extra doctors`, completed: true },
      { task: 'Extend ER shifts', completed: false },
      { task: 'On-call specialists ready', completed: false },
    ];

    const baseSupplies = [
      { task: 'Stock oxygen cylinders', completed: true },
      { task: 'General medical supplies', completed: false },
      { task: 'Emergency medicines', completed: false },
      { task: 'Extra PPE kits', completed: false },
    ];

    const baseInfrastructure = [
      { task: `Prepare ${festival.level === 'high' ? '20' : '10'} extra beds`, completed: false },
      { task: 'Setup air purifiers', completed: false },
      { task: 'ICU capacity check', completed: false },
      { task: 'Test backup generators', completed: false },
    ];

    // Festival-specific items
    if (festival.name.toLowerCase().includes('diwali')) {
      baseSupplies.splice(1, 0, { task: 'Burn treatment kits', completed: false });
      baseSupplies.splice(2, 0, { task: 'Respiratory medicines', completed: false });
    } else if (festival.name.toLowerCase().includes('holi')) {
      baseSupplies.splice(1, 0, { task: 'Eye care supplies', completed: false });
      baseSupplies.splice(2, 0, { task: 'Skin allergy medicines', completed: false });
    } else if (festival.name.toLowerCase().includes('ganesh')) {
      baseSupplies.splice(1, 0, { task: 'Trauma care supplies', completed: false });
      baseInfrastructure.splice(1, 0, { task: 'Emergency response team', completed: false });
    }

    return {
      staffing: baseStaffing,
      supplies: baseSupplies,
      infrastructure: baseInfrastructure,
    };
  };

  const checklistItems = getChecklistItems(targetFestival);
  const totalItems = checklistItems.staffing.length + checklistItems.supplies.length + checklistItems.infrastructure.length;
  const completedItems = [
    ...checklistItems.staffing,
    ...checklistItems.supplies,
    ...checklistItems.infrastructure,
  ].filter(item => item.completed).length;
  const completionPercentage = Math.round((completedItems / totalItems) * 100);

  // Generate calendar days for the viewed month
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.
  const calendarFirstDay = firstDayOfWeek;
  const calendarDays = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < calendarFirstDay; i++) {
    calendarDays.push(null);
  }

  // Add actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const festival = festivals.find(f => f.day === day);
    calendarDays.push({ day, festival });
  }

  // Get next high impact festival
  const nextHighImpactFestival = INDIAN_FESTIVALS_2026.filter(f => {
    const festDate = new Date(f.date);
    return festDate >= currentDate && f.level === 'high';
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  // Calculate days until next high impact festival
  const daysUntilNextHighImpact = nextHighImpactFestival
    ? Math.ceil((new Date(nextHighImpactFestival.date).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Count festivals this month
  const festivalsThisMonth = festivals.length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Upcoming High Impact</CardTitle>
          </CardHeader>
          <CardContent>
            {nextHighImpactFestival ? (
              <>
                <div className="text-2xl text-gray-900">{nextHighImpactFestival.name}</div>
                <div className="text-sm text-gray-500 mt-1">{formatFestivalDate(nextHighImpactFestival.date)}</div>
              </>
            ) : (
              <>
                <div className="text-2xl text-gray-900">None</div>
                <div className="text-sm text-gray-500 mt-1">No upcoming festivals</div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Expected Surge</CardTitle>
          </CardHeader>
          <CardContent>
            {nextHighImpactFestival ? (
              <>
                <div className="text-2xl text-gray-900">{nextHighImpactFestival.surge}</div>
                <div className="text-sm text-gray-500 mt-1">Patient load increase</div>
              </>
            ) : (
              <>
                <div className="text-2xl text-gray-900">Normal</div>
                <div className="text-sm text-gray-500 mt-1">Baseline levels</div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Festivals This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900">{festivalsThisMonth}</div>
            <div className="text-sm text-gray-500 mt-1">{currentMonthName} {currentYear}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Preparation Days</CardTitle>
          </CardHeader>
          <CardContent>
            {nextHighImpactFestival ? (
              <>
                <div className="text-2xl text-gray-900">{daysUntilNextHighImpact > 0 ? daysUntilNextHighImpact : 0}</div>
                <div className="text-sm text-gray-500 mt-1">Until {nextHighImpactFestival.name}</div>
              </>
            ) : (
              <>
                <div className="text-2xl text-gray-900">--</div>
                <div className="text-sm text-gray-500 mt-1">No upcoming events</div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Calendar View - Smaller Size */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-purple-600" />
              Festival Calendar
              {isLiveMode && (
                <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  <Wifi className="w-3 h-3" />
                  Live Data
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Month Navigation */}
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1">
                <button
                  onClick={goToPreviousMonth}
                  className="px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
                  title="Previous month"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="px-3 text-sm text-gray-900 min-w-[140px] text-center">
                  {viewMonthName} {viewYear}
                </div>
                <button
                  onClick={goToNextMonth}
                  className="px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
                  title="Next month"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Today button */}
              {(viewMonth !== currentMonth || viewYear !== currentYear) && (
                <button
                  onClick={goToCurrentMonth}
                  className="px-3 py-2 border border-teal-200 bg-teal-50 text-teal-700 rounded-lg text-sm hover:bg-teal-100 transition-colors"
                >
                  Today
                </button>
              )}

              {/* Refresh button */}
              <button
                onClick={loadFestivals}
                disabled={isLoading}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid - Reduced Size */}
          <div className="grid grid-cols-7 gap-1 max-w-2xl">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs text-gray-600 py-1">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map((item, index) => {
              if (!item) {
                return <div key={`empty-${index}`} className="aspect-square"></div>;
              }

              const { day, festival } = item;
              // Check if this day is today AND viewing current month/year
              const isToday = day === today && viewMonth === currentMonth && viewYear === currentYear;

              return (
                <div
                  key={day}
                  className={`aspect-square border rounded-md p-1 text-xs ${isToday ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-300' : 'border-gray-200'
                    } ${festival ? 'bg-purple-50 border-purple-300 hover:shadow-md' : 'hover:bg-gray-50'} transition-all cursor-pointer relative`}
                >
                  <div className="text-xs text-gray-900">{day}</div>
                  {festival && (
                    <div className="mt-0.5">
                      <div className="text-[10px] text-purple-700 line-clamp-1 leading-tight">{festival.name}</div>
                      <div className="text-[9px] text-purple-500">{festival.surge}</div>
                    </div>
                  )}
                  {isToday && (
                    <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-teal-500 rounded-full ring-1 ring-white"></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-50 border border-purple-300 rounded"></div>
              <span className="text-gray-600">Festival Day</span>
            </div>
            {viewMonth === currentMonth && viewYear === currentYear && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-teal-50 border-2 border-teal-500 rounded"></div>
                <span className="text-gray-600">Today ({today} {currentMonthName.slice(0, 3)})</span>
              </div>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-gray-500">
                {viewMonth !== currentMonth || viewYear !== currentYear ? (
                  <span className="text-blue-600">Viewing past/future data</span>
                ) : (
                  <span>Current Month</span>
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Festival Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* This Month's Festivals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              {viewMonthName} {viewYear} Festivals - Impact Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {festivals.length > 0 ? (
              <div className="space-y-4">
                {festivals.map((festival, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-gray-900">{festival.name}</h3>
                        <p className="text-sm text-gray-500">{festival.region}</p>
                      </div>
                      {getSurgeBadge(festival.level)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span>📅 {viewMonthName.slice(0, 3)} {festival.day}, {viewYear}</span>
                      <span className="text-orange-600">↑ {festival.surge} surge</span>
                    </div>
                    <p className="text-sm text-gray-600">{festival.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No festivals this month</p>
                <p className="text-sm mt-1">Check upcoming festivals in the next section</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Major Festivals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              Upcoming Major Festivals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingFestivals.map((festival, index) => (
                <div
                  key={index}
                  className="p-4 bg-blue-50 border border-blue-200 rounded-xl"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-gray-900">{festival.name}</h3>
                    <Badge className="bg-blue-500">{festival.surge}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>📅 {festival.date}</span>
                    <span>📍 {festival.region}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-800">
                    <strong>Planning Tip:</strong> Begin staff scheduling and inventory procurement at least 2 weeks before high-impact festivals.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  );
}
/* updated */
