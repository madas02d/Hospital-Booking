import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaUserMd, FaMoneyBillWave } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import StatCard from '../components/dashboard/StatCard';
import ActivityItem from '../components/dashboard/ActivityItem';
import AppointmentCard from '../components/appointments/AppointmentCard';
import Button from '../components/common/Button';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    totalSpent: 0
  });
  const [nextAppointment, setNextAppointment] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/api/appointments');
        const appointments = response.data;
        
        // Calculate statistics
        const totalAppointments = appointments.length;
        const upcomingAppointments = appointments.filter(apt => 
          new Date(apt.date) > new Date() && apt.status === 'scheduled'
        ).length;
        const totalSpent = appointments.reduce((sum, apt) => 
          apt.status === 'completed' ? sum + (apt.consultationFee || 0) : sum, 0
        );

        setStats({
          totalAppointments,
          upcomingAppointments,
          totalSpent: totalSpent.toFixed(2)
        });

        // Find next appointment
        const nextAppt = appointments
          .filter(apt => new Date(apt.date) > new Date() && apt.status === 'scheduled')
          .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
        setNextAppointment(nextAppt);

        // Process recent activity
        const activities = appointments.map(apt => ({
          id: apt._id,
          type: apt.status === 'cancelled' ? 'cancellation' : 
                new Date(apt.date) > new Date() ? 'booking' : 'completion',
          description: `${
            apt.status === 'cancelled' ? 'Cancelled' :
            new Date(apt.date) > new Date() ? 'Booked' : 'Completed'
          } appointment with ${apt.doctorName}`,
          date: apt.createdAt || apt.date,
          doctorName: apt.doctorName,
          appointmentDate: apt.date,
          appointmentTime: apt.time,
          status: apt.status
        }));
        
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecentActivity(activities.slice(0, 5));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(
          err.response?.data?.message || 
          'Failed to load dashboard data. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="text-red-600 mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await api.patch(`/api/appointments/${appointmentId}/cancel`);
      // Refresh dashboard data after cancellation
      if (currentUser) {
        const response = await api.get('/api/appointments');
        const appointments = response.data;
        // ... repeat stats logic if needed ...
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      setError(
        err.response?.data?.message || 
        'Failed to cancel appointment. Please try again.'
      );
    }
  };

  const quickActions = [
    { 
      label: 'Book Appointment', 
      link: '/find-clinics', 
      primary: true,
      icon: '📅'
    },
    { 
      label: 'View Appointments', 
      link: '/appointments', 
      primary: false,
      icon: '👨‍⚕️'
    },
    { 
      label: 'Find a Doctor', 
      link: '/find-clinics', 
      primary: false,
      icon: '🔍'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <Link to="/find-clinics">
            <Button variant="primary">Book New Appointment</Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <StatCard 
            title="Total Appointments" 
            value={stats.totalAppointments}
            icon={<FaCalendarAlt className="h-6 w-6" />}
            className="bg-white"
          />
          <StatCard 
            title="Upcoming Appointments" 
            value={stats.upcomingAppointments}
            icon={<FaUserMd className="h-6 w-6" />}
            className="bg-white"
          />
          <StatCard 
            title="Total Spent" 
            value={`$${stats.totalSpent}`}
            icon={<FaMoneyBillWave className="h-6 w-6" />}
            className="bg-white"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Next Appointment</h2>
              {nextAppointment ? (
                <AppointmentCard 
                  appointment={nextAppointment} 
                  onCancel={handleCancelAppointment}
                />
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">No upcoming appointments</p>
                  <Link to="/find-clinics">
                    <Button variant="primary">Book an Appointment</Button>
                  </Link>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickActions.map((action, index) => (
                  <Link key={index} to={action.link}>
                    <Button 
                      variant={action.primary ? "primary" : "secondary"}
                      className="w-full flex items-center justify-center"
                    >
                      <span className="mr-2">{action.icon}</span>
                      {action.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map(activity => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 