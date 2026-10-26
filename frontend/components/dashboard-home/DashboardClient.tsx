'use client';

import { useDashboardData } from '@/hooks/dashboard-home/useDashboardData';
import DashboardLoading from './DashboardLoading';
import DashboardHero from './DashboardHero';
import DashboardError from './DashboardError';
import SummaryCards from './SummaryCards';
import QuickAccess from './QuickAccess';
import UpcomingSessions from './UpcomingSessions';
import LearningHub from './LearningHub';
import MyGroups from './MyGroups';

export default function DashboardClient() {
  const {
    userData,
    groups,
    sessions,
    loading,
    refreshing,
    error,
    loadDashboardData,
    upcomingSessions,
    myGroups,
  } = useDashboardData();

  if (loading) {
    return <DashboardLoading />;
  }

  return (
    <div className="w-full space-y-6 pb-8">
      <DashboardHero
        userData={userData}
        refreshing={refreshing}
        loadDashboardData={loadDashboardData}
        myGroups={myGroups}
        upcomingSessions={upcomingSessions}
        sessions={sessions}
      />
      {error && (
        <DashboardError
          error={error}
          loadDashboardData={loadDashboardData}
        />
      )}
      <SummaryCards
        myGroups={myGroups}
        upcomingSessions={upcomingSessions}
        groups={groups}
        sessions={sessions}
      />
      <QuickAccess />
      <section className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
        <UpcomingSessions upcomingSessions={upcomingSessions} />
        <LearningHub />
      </section>
      <MyGroups myGroups={myGroups} />
    </div>
  );
}
