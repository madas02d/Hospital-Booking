import { useState } from 'react'
import ReviewCard from './ReviewCard'
import Button from '../common/Button'

function ReviewsSection({ doctorId, doctorName }) {
  const [showAll, setShowAll] = useState(false)

  // Mock reviews data - in a real app, this would come from an API
  const reviews = [
    {
      id: 1,
      userName: "John Smith",
      userImage: "https://randomuser.me/api/portraits/men/1.jpg",
      rating: 5,
      date: "2024-03-15",
      comment: "Dr. Johnson was extremely professional and thorough. She took the time to explain everything clearly and made me feel at ease.",
      verified: true,
      doctorName: doctorName
    },
    {
      id: 2,
      userName: "Sarah Davis",
      userImage: "https://randomuser.me/api/portraits/women/2.jpg",
      rating: 4,
      date: "2024-03-10",
      comment: "Great experience overall. The wait time was a bit long but the care received was excellent.",
      verified: true,
      doctorReply: "Thank you for your feedback, Sarah. We're working on improving our scheduling to reduce wait times.",
      doctorName: doctorName
    },
    {
      id: 3,
      userName: "Michael Brown",
      userImage: "https://randomuser.me/api/portraits/men/3.jpg",
      rating: 5,
      date: "2024-03-05",
      comment: "Excellent doctor! Very knowledgeable and caring. Would highly recommend.",
      verified: true,
      doctorName: doctorName
    },
    {
      id: 4,
      userName: "Emily Wilson",
      userImage: "https://randomuser.me/api/portraits/women/4.jpg",
      rating: 5,
      date: "2024-03-01",
      comment: "Dr. Johnson provided exceptional care. She was attentive and addressed all my concerns.",
      verified: true,
      doctorName: doctorName
    }
  ]

  const displayedReviews = showAll ? reviews : reviews.slice(0, 2)

  const averageRating = (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold">Patient Reviews</h3>
          <div className="flex items-center mt-1">
            <span className="text-yellow-400 text-xl">★</span>
            <span className="ml-1 font-medium">{averageRating}</span>
            <span className="ml-1 text-gray-600">({reviews.length} reviews)</span>
          </div>
        </div>
        <Button 
          variant="secondary"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Show Less' : 'Show All Reviews'}
        </Button>
      </div>

      <div className="space-y-4">
        {displayedReviews.map(review => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {!showAll && reviews.length > 2 && (
        <div className="text-center mt-6">
          <Button 
            variant="secondary"
            onClick={() => setShowAll(true)}
          >
            Show All {reviews.length} Reviews
          </Button>
        </div>
      )}
    </div>
  )
}

export default ReviewsSection 