import React from 'react';

export const DateFilter = ({ value, onChange}) => (
  <div className='bg-stone-100 mt-5 mx-3 relative rounded flex items-center px-2 py-1.5 text-sm'>
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent placeholder:text-stone-400 font-medium focus:outline-none"
    />
  </div>
);