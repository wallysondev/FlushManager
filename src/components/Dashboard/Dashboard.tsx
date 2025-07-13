import React from 'react';
import { Topbar } from './TopBar';
import { Grid } from './Grid';

export const Dashboard = () => {
    return (
    <div className = "bg-stone-50 rounded-xl shadow-lg h-[100vh-32]">
        <Topbar />
        <Grid />
    </div>
    );
}

