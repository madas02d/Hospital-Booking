import React, { useState, useEffect } from 'react'
import api from '../utils/api'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'
import DoctorCard from '../components/doctors/DoctorCard'
import SpecialtyFilter from '../components/doctors/SpecialtyFilter'
import Button from '../components/common/Button'

function Doctors() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch doctors from Firestore
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const doctorsRef = collection(db, 'doctors')
        const snapshot = await getDocs(doctorsRef)
        const doctorsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        console.log('Fetched doctors:', doctorsList)
        setDoctors(doctorsList)
      } catch (error) {
        console.error('Error fetching doctors:', error)
        setError('Failed to fetch doctors')
      } finally {
        setLoading(false)
      }
    }

    fetchDoctors()
  }, [])

  // Extract unique specialties from doctors
  const specialties = [...new Set(doctors.map(doctor => doctor.specialty))]

  // Filter doctors based on search term and selected specialty
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSpecialty = !selectedSpecialty || doctor.specialty === selectedSpecialty
    return matchesSearch && matchesSpecialty
  })

  if (loading) {
    return <div className="text-center py-12">Loading doctors...</div>
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Find a Doctor</h1>
        <div className="flex gap-4 items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Search doctors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Specialties Filter */}
      <SpecialtyFilter
        specialties={specialties}
        selectedSpecialty={selectedSpecialty}
        onSpecialtyChange={setSelectedSpecialty}
      />

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map(doctor => (
          <DoctorCard key={doctor.id} doctor={doctor} />
        ))}
      </div>

      {filteredDoctors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No doctors found matching your criteria.</p>
          <Button 
            variant="secondary" 
            onClick={() => {
              setSearchTerm('')
              setSelectedSpecialty(null)
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}

export default Doctors 