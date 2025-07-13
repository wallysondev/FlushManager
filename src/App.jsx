import React from 'react'
import Home from './pages/Home'
import Login from './pages/Login'

import { createBrowserRouter, RouterProvider } from 'react-router-dom'

const router = createBrowserRouter([
    {
        path:'/',
        element: <div><Login /></div>
    },
    {
        path:'/Home',
        element: <div><Home /></div>
    },
    {
        path:'*',
        element: <div><Login /></div>
    }
])

const App = () => {
  return (
    <div>
      <RouterProvider router={router} />
    </div>
  )
}

export default App

