import React from 'react';
import { FiSearch } from 'react-icons/fi';

export const Search = ({ value, onChange }) => {
    return (
        <div className='bg-gray-50 px-5 mb-3 rounded flex items-center text-sm'>
            <FiSearch className='mr-2' />
            <input
                type='text'
                placeholder='Pesquisar Orçamento'
                className='w-full bg-transparent placeholder:text-stone-400 text-sm focus:outline-none'
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
};
