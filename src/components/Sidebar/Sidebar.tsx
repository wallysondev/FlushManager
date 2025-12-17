import React from 'react';
import { AccountToggle } from './AccountToggle';
import { Search } from '../Dashboard/Search';
import { RouteSelect } from './RouteSelect';
import { Footer } from './Footer';

export const Sidebar = () => {
    return (
        <div>
            <div className='overflow-hidden sticky top-4 h-[calc(100vh-32px-48px)]'>
                <AccountToggle />
                <RouteSelect />
            </div>
            <Footer />
        </div>
    );
}