import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { seedDoctors } from '../utils/seedDoctors'
import Button from '../components/common/Button'
import { useAuth } from '../contexts/AuthContext'

// Admin user email - replace with your admin email
const ADMIN_EMAIL = "admin@example.com" // Replace with your admin email

function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Check if user is not admin
    if (!user || user.email !== ADMIN_EMAIL) {
      navigate('/')
      return
    }
  }, [user, navigate])

  // If no user or not admin, don't render anything
  if (!user || user.email !== ADMIN_EMAIL) {
    return null
  }

  const handleSeedDoctors = async () => {
    setLoading(true)
    setMessage('')
    try {
      await seedDoctors()
      setMessage('Successfully seeded doctors data!')
    } catch (error) {
      console.error('Seeding error:', error)
      setMessage('Error seeding doctors: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="text-sm text-gray-600">
            Logged in as: {user.email}
          </div>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">Database Management</h2>
            <div className="space-y-4">
              <div>
                <Button
                  variant="primary"
                  onClick={handleSeedDoctors}
                  disabled={loading}
                >
                  {loading ? 'Seeding...' : 'Seed Doctors Data'}
                </Button>
              </div>

              {message && (
                <p className={`mt-2 ${
                  message.includes('Error') ? 'text-red-600' : 'text-green-600'
                }`}>
                  {message}
                </p>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">System Statistics</h2>
            <div className="space-y-2 text-gray-600">
              <p>Admin Email: {ADMIN_EMAIL}</p>
              <p>Last Updated: {new Date().toLocaleString()}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Admin 