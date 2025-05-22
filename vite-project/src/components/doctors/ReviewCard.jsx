function ReviewCard({ review }) {
  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <span 
        key={index} 
        className={`text-lg ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ))
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <div className="flex items-start space-x-4">
        <img 
          src={review.userImage || 'https://via.placeholder.com/40'} 
          alt={review.userName}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-gray-900">{review.userName}</h4>
              <div className="flex items-center mt-1">
                {renderStars(review.rating)}
                <span className="ml-2 text-sm text-gray-500">
                  {formatDate(review.date)}
                </span>
              </div>
            </div>
            {review.verified && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Verified Patient
              </span>
            )}
          </div>
          <p className="mt-2 text-gray-600">{review.comment}</p>
          {review.doctorReply && (
            <div className="mt-3 pl-4 border-l-2 border-gray-200">
              <p className="text-sm font-medium text-gray-900">Response from Dr. {review.doctorName}</p>
              <p className="mt-1 text-sm text-gray-600">{review.doctorReply}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReviewCard 