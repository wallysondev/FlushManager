import React from 'react';

export const DateFilter = ({ value, onChange}) => (
  <div className='bg-gray-50 py-2 px-5 mb-3 relative rounded flex items-center text-sm'>
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent placeholder:text-stone-400 text-sm focus:outline-none"
    />
  </div>
);