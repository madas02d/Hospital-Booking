import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'
import DoctorList from '../components/doctors/DoctorList'
import Button from '../components/common/Button'

function Home() {
  const [searchTerm, setSearchTerm] = useState('')
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const doctorsRef = collection(db, 'doctors')
        const snapshot = await getDocs(doctorsRef)
        const doctorsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setDoctors(doctorsList)
      } catch (error) {
        console.error('Error fetching doctors:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDoctors()
  }, [])

  if (loading) {
    return <div className="text-center py-8">Loading doctors...</div>
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">
            Book Appointments with Top Doctors Near You
          </h1>
          <p className="text-xl mb-8">
            Find and schedule appointments with the best healthcare professionals
          </p>
          <div className="flex gap-4 max-w-2xl">
            <input
              type="text"
              placeholder="Search doctors by specialty..."
              className="flex-1 px-4 py-2 rounded-md text-gray-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="secondary">Search</Button>
          </div>
        </div>
      </div>

      {/* Doctors Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold mb-6">Available Doctors</h2>
        <DoctorList doctors={doctors} onDoctorSelect={(doctor) => console.log('Selected doctor:', doctor)} />
      </div>
    </div>
  )
}

export default Home 