function SpecialtyFilter({ specialties, selectedSpecialty, onSpecialtyChange }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-3">Specialties</h2>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSpecialtyChange(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
            ${!selectedSpecialty 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          All
        </button>
        {specialties.map(specialty => (
          <button
            key={specialty}
            onClick={() => onSpecialtyChange(specialty)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${selectedSpecialty === specialty 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {specialty}
          </button>
        ))}
      </div>
    </div>
  )
}

export default SpecialtyFilter 