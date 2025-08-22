import React, { useState } from 'react';
import { FaSeedling } from 'react-icons/fa';

const SeedButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSeedData = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage('Data seeded successfully!');
      } else {
        setMessage(data.message || 'Failed to seed data');
      }
    } catch (error) {
      setMessage('Error seeding data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={handleSeedData}
        disabled={isLoading}
        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
      >
        <FaSeedling className="h-4 w-4" />
        <span>{isLoading ? 'Seeding...' : 'Seed Sample Data'}</span>
      </button>
      
      {message && (
        <div className={`mt-2 p-2 rounded-md text-sm ${
          message.includes('successfully') 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default SeedButton;
