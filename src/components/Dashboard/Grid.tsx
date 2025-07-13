import React from 'react'
import { StatCards } from './StatCards'
import { RecentTransactions } from './RecentTransactions'

export const Grid = () => {
  return (
    <div className='px-4 pb-4 grid gap-2 grid-cols-12'>
        <StatCards /> 
        <RecentTransactions />            
    </div>
  )
}
