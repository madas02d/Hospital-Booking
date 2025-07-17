import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../contexts/AuthContext'

function UserAppointments() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const q = query(
          collection(db, 'appointments'),
          where('userId', '==', user.uid)
        )
        const querySnapshot = await getDocs(q)
        const appointmentList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setAppointments(appointmentList)
      } catch (error) {
        console.error('Error fetching appointments:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchAppointments()
    }
  }, [user])

  if (loading) {
    return <div className="text-center py-4">Loading appointments...</div>
  }

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">My Appointments</h2>
      {appointments.length === 0 ? (
        <p className="text-gray-600">No appointments scheduled yet.</p>
      ) : (
        <div className="space-y-4">
          {appointments.map(appointment => (
            <div 
              key={appointment.id} 
              className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg">{appointment.doctorName}</h3>
                  <p className="text-gray-600">{appointment.specialty}</p>
                  <p className="text-gray-600 mt-1">
                    {new Date(appointment.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-gray-600">Time: {appointment.time}</p>
                  {appointment.reason && (
                    <p className="text-gray-600 mt-2">
                      Reason: {appointment.reason}
                    </p>
                  )}
                </div>
                <span 
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    new Date(appointment.date) > new Date()
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {new Date(appointment.date) > new Date() ? 'Upcoming' : 'Past'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default UserAppointments 