import React from 'react';

const DoctorCard = ({ doctor }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
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
  );
};

export default DoctorCard;
