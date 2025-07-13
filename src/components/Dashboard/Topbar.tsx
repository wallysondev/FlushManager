import React from 'react';

export const Topbar = () =>{
    return (
        <div className='border-b px-4 mb-4 mt-3 pb-2 border-stone-200'>
            <div className='flex items-center justify-between p-0.5'>
                <div>
                    <span className='text-sm font-bold block'>Seja bem vindo, Wallyson</span>
                    <span className='text-sm font-bold block text-stone-500'>Quarta-feira, 11 de junho de 2025</span>
                </div>
                <div className='flex items-center px-2 py-1.5 text-sm'>
                    <button className='w-full bg-transparent focus:outline-none'>Ultima Sincronização: 13/06/2025 as 17:13:05</button>
                </div>
            </div>
        </div>
    );
}