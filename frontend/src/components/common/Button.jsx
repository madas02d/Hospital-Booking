import React from 'react';

const Button = ({ 
  children, 
  type = 'button', 
  variant = 'primary',
  className = '', 
  disabled = false, 
  onClick, 
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200';
  
  const getVariantClasses = () => {
    if (disabled) {
      return 'bg-gray-300 text-gray-500 cursor-not-allowed';
    }
    
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800';
      case 'secondary':
        return 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500 active:bg-gray-400';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800';
    }
  };
  
  const combinedClasses = `${baseClasses} ${getVariantClasses()} ${className}`;

  return (
    <button
      type={type}
      className={combinedClasses}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
