import { useState } from 'react'
import Button from '../common/Button'
import { seedDoctors } from '../../utils/seedDoctors'

function SeedButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSeed = async () => {
    setLoading(true)
    setMessage('')
    try {
      await seedDoctors()
      setMessage('Successfully seeded doctors collection!')
    } catch (error) {
      setMessage('Error seeding doctors: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Button
        variant="secondary"
        onClick={handleSeed}
        disabled={loading}
      >
        {loading ? 'Seeding...' : 'Seed Doctors Data'}
      </Button>
      {message && (
        <p className={`mt-2 text-sm ${
          message.includes('Error') ? 'text-red-600' : 'text-green-600'
        }`}>
          {message}
        </p>
      )}
    </div>
  )
}

export default SeedButton 