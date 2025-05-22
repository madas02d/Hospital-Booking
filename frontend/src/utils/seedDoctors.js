import { collection, addDoc, getDocs, query } from 'firebase/firestore'
import { db } from '../config/firebase'

const doctorsData = [
  {
    name: "Dr. Sarah Johnson",
    specialty: "Cardiologist",
    experience: 10,
    description: "Specialized in cardiovascular health with focus on preventive care.",
    availableSlots: 5,
    imageUrl: "https://randomuser.me/api/portraits/women/76.jpg",
    rating: 4.8,
    reviews: 124,
    qualifications: "MD, FACC",
    languages: ["English", "Spanish"],
    consultationFee: 150,
    availability: {
      monday: ["09:00", "10:00", "11:00", "14:00", "15:00"],
      tuesday: ["09:00", "10:00", "11:00", "14:00", "15:00"],
      wednesday: ["09:00", "10:00", "11:00", "14:00", "15:00"],
      thursday: ["09:00", "10:00", "11:00", "14:00", "15:00"],
      friday: ["09:00", "10:00", "11:00", "14:00", "15:00"]
    }
  },
  {
    name: "Dr. Michael Chen",
    specialty: "Pediatrician",
    experience: 15,
    description: "Dedicated to providing comprehensive care for children of all ages.",
    availableSlots: 3,
    imageUrl: "https://randomuser.me/api/portraits/men/32.jpg",
    rating: 4.9,
    reviews: 89,
    qualifications: "MD, FAAP",
    languages: ["English", "Mandarin"],
    consultationFee: 120,
    availability: {
      monday: ["09:00", "10:00", "11:00", "14:00", "15:00"],
      tuesday: ["09:00", "10:00", "11:00", "14:00", "15:00"],
      wednesday: ["09:00", "10:00", "11:00", "14:00", "15:00"],
      thursday: ["09:00", "10:00", "11:00", "14:00", "15:00"],
      friday: ["09:00", "10:00", "11:00", "14:00", "15:00"]
    }
  },
  {
    name: "Dr. Emily Wilson",
    specialty: "Dermatologist",
    experience: 8,
    description: "Expert in treating various skin conditions and cosmetic procedures.",
    availableSlots: 4,
    imageUrl: "https://randomuser.me/api/portraits/women/45.jpg",
    rating: 4.7,
    reviews: 156,
    qualifications: "MD, FAAD",
    languages: ["English"],
    consultationFee: 140,
    availability: {
      monday: ["09:00", "10:00", "11:00", "14:00", "15:00"],
      tuesday: ["09:00", "10:00", "11:00", "14:00", "15:00"],
      wednesday: ["09:00", "10:00", "11:00", "14:00", "15:00"],
      thursday: ["09:00", "10:00", "11:00", "14:00", "15:00"],
      friday: ["09:00", "10:00", "11:00", "14:00", "15:00"]
    }
  },
  {
    name: "Dr. James Martinez",
    specialty: "Orthopedist",
    experience: 12,
    description: "Specializing in sports medicine and joint replacement surgery.",
    availableSlots: 2,
    imageUrl: "https://randomuser.me/api/portraits/men/55.jpg",
    rating: 4.9,
    reviews: 201,
    qualifications: "MD, FAAOS",
    languages: ["English", "Spanish"],
    consultationFee: 160,
    availability: {
      monday: ["09:00", "10:00", "11:00", "14:00", "15:00"],
      tuesday: ["09:00", "10:00", "11:00", "14:00", "15:00"],
      wednesday: ["09:00", "10:00", "11:00", "14:00", "15:00"],
      thursday: ["09:00", "10:00", "11:00", "14:00", "15:00"],
      friday: ["09:00", "10:00", "11:00", "14:00", "15:00"]
    }
  }
]

export const seedDoctors = async () => {
  try {
    // Check if doctors already exist
    const q = query(collection(db, 'doctors'))
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      console.log('Doctors collection already seeded')
      return
    }

    // Add doctors to Firestore
    const doctorsRef = collection(db, 'doctors')
    for (const doctor of doctorsData) {
      await addDoc(doctorsRef, {
        ...doctor,
        createdAt: new Date().toISOString()
      })
    }
    
    console.log('Successfully seeded doctors collection')
  } catch (error) {
    console.error('Error seeding doctors:', error)
    throw error
  }
} 