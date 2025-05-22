import { useState } from 'react'
import DoctorCard from './DoctorCard'

function DoctorList({ doctors, onDoctorSelect }) {
  console.log('DoctorList rendered with doctors:', doctors)
  
  if (!doctors || doctors.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No doctors available at the moment.</p>
      </div>
    )
  }

  console.log('Doctors passed to DoctorList:', doctors)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('')

  // Get unique specialties from doctors
  const specialties = [...new Set(doctors.map(doctor => doctor.specialty))]
  console.log('Available specialties:', specialties)

  // Filter doctors based on search and specialty
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSpecialty = !selectedSpecialty || doctor.specialty === selectedSpecialty
    return matchesSearch && matchesSpecialty
  })
  console.log('Filtered doctors:', filteredDoctors)

  return (
    <div>
      {/* Search and Filter Section */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search doctors by name or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Specialties</option>
            {specialties.map(specialty => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredDoctors.map(doctor => (
          <div 
            key={doctor.id}
            className="cursor-pointer transform transition-transform hover:scale-105"
            onClick={() => onDoctorSelect(doctor)}
          >
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg">
              <div className="flex items-center space-x-4">
                <img 
                  src={doctor.imageUrl} 
                  alt={doctor.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-lg font-semibold">{doctor.name}</h3>
                  <p className="text-gray-600">{doctor.specialty}</p>
                  <div className="flex items-center mt-1">
                    <span className="text-yellow-400">★</span>
                    <span className="text-gray-700 ml-1">{doctor.rating}</span>
                    <span className="text-gray-500 ml-1">({doctor.reviews} reviews)</span>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                    {doctor.experience} years exp.
                  </span>
                  <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                    ${doctor.consultationFee}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDoctors.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No doctors found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}

export default DoctorList 