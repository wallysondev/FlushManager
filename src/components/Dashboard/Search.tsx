import React from 'react';
import { FiSearch } from 'react-icons/fi';

export const Search = ({ value, onChange }) => {
    return (
        <div className='bg-stone-100 mt-5 mx-3 relative rounded flex items-center px-2 py-1.5 text-sm'>
            <FiSearch className='mr-2' />
            <input
                type='text'
                placeholder='Pesquisar Orçamento'
                className='w-full bg-transparent placeholder:text-stone-400 font-medium focus:outline-none'
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
};
