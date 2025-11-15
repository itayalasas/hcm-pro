import { useEffect, useState } from 'react';
import { Users, TrendingUp, Calendar, DollarSign, UserPlus, UserMinus, Clock, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: any;
  iconBg: string;
  iconColor: string;
}

function StatCard({ title, value, change, changeType, icon: Icon, iconBg, iconColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mb-2">{value}</p>
          {change && (
            <p className={`text-sm font-medium ${changeType === 'positive' ? 'text-green-600' : changeType === 'negative' ? 'text-red-600' : 'text-slate-500'}`}>
              {change}
            </p>
          )}
        </div>
        <div className={`${iconBg} p-3 rounded-xl`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeaves: 0,
    avgSalary: 0,
    newHires: 0,
    terminations: 0,
    pendingEvaluations: 0,
    completedTraining: 0,
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: employees } = await supabase
        .from('employees')
        .select('*');

      const { data: leaveRequests } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('status', 'pending');

      const activeEmployees = employees?.filter(e => e.status === 'active') || [];
      const thisMonth = new Date();
      thisMonth.setDate(1);

      const newHires = employees?.filter(e =>
        new Date(e.hire_date) >= thisMonth
      ) || [];

      setStats({
        totalEmployees: employees?.length || 0,
        activeEmployees: activeEmployees.length,
        pendingLeaves: leaveRequests?.length || 0,
        avgSalary: 0,
        newHires: newHires.length,
        terminations: 0,
        pendingEvaluations: 0,
        completedTraining: 0,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">Welcome back! Here's what's happening with your organization.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          change={`${stats.activeEmployees} active`}
          changeType="neutral"
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Pending Leave Requests"
          value={stats.pendingLeaves}
          change="Requires attention"
          changeType="neutral"
          icon={Calendar}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="New Hires (This Month)"
          value={stats.newHires}
          change="+12% vs last month"
          changeType="positive"
          icon={UserPlus}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          title="Pending Evaluations"
          value={stats.pendingEvaluations}
          change="2 cycles active"
          changeType="neutral"
          icon={Award}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group">
              <UserPlus className="w-8 h-8 text-slate-400 group-hover:text-blue-600 mb-2" />
              <h3 className="font-medium text-slate-900 mb-1">Add Employee</h3>
              <p className="text-sm text-slate-500">Onboard a new team member</p>
            </button>
            <button className="p-4 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group">
              <Calendar className="w-8 h-8 text-slate-400 group-hover:text-blue-600 mb-2" />
              <h3 className="font-medium text-slate-900 mb-1">Approve Leaves</h3>
              <p className="text-sm text-slate-500">{stats.pendingLeaves} requests pending</p>
            </button>
            <button className="p-4 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group">
              <DollarSign className="w-8 h-8 text-slate-400 group-hover:text-blue-600 mb-2" />
              <h3 className="font-medium text-slate-900 mb-1">Process Payroll</h3>
              <p className="text-sm text-slate-500">Run monthly payroll</p>
            </button>
            <button className="p-4 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group">
              <TrendingUp className="w-8 h-8 text-slate-400 group-hover:text-blue-600 mb-2" />
              <h3 className="font-medium text-slate-900 mb-1">Evaluations</h3>
              <p className="text-sm text-slate-500">Manage performance reviews</p>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Company Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Headcount</p>
                  <p className="text-xs text-slate-500">Active employees</p>
                </div>
              </div>
              <p className="text-lg font-bold text-slate-900">{stats.activeEmployees}</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Retention</p>
                  <p className="text-xs text-slate-500">Past 12 months</p>
                </div>
              </div>
              <p className="text-lg font-bold text-slate-900">94%</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Avg Tenure</p>
                  <p className="text-xs text-slate-500">Company average</p>
                </div>
              </div>
              <p className="text-lg font-bold text-slate-900">3.2y</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {[
              { type: 'leave', text: 'John Smith requested 5 days vacation', time: '2 hours ago', color: 'blue' },
              { type: 'hire', text: 'New employee Maria Garcia added', time: '5 hours ago', color: 'green' },
              { type: 'eval', text: 'Q4 Performance reviews started', time: '1 day ago', color: 'purple' },
              { type: 'doc', text: 'Updated employee handbook published', time: '2 days ago', color: 'amber' },
            ].map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 bg-${activity.color}-500`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{activity.text}</p>
                  <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Events</h2>
          <div className="space-y-3">
            {[
              { date: 'Nov 20', title: 'Payroll Processing Deadline', type: 'deadline' },
              { date: 'Nov 22', title: 'Company Town Hall Meeting', type: 'meeting' },
              { date: 'Nov 25', title: 'Performance Review Cycle Ends', type: 'deadline' },
              { date: 'Nov 30', title: 'Monthly HR Reports Due', type: 'report' },
            ].map((event, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200">
                <div className="text-center">
                  <div className="text-xs font-medium text-slate-500 uppercase">{event.date.split(' ')[0]}</div>
                  <div className="text-xl font-bold text-slate-900">{event.date.split(' ')[1]}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{event.title}</p>
                  <p className="text-xs text-slate-500 capitalize">{event.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
