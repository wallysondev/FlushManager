import React from 'react'
import Home from './pages/Home'
import Login from './pages/Login'
import Importe from './pages/Importe'
import VisualizarOrcamento from './pages/Visualizar';

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute';

const router = createBrowserRouter([
    {
        path: '/',
        element: <Login />
    },
    {
        path: '/Home',
        element: (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        )
    },
    {
        path: '/Importe',
        element: (
          <ProtectedRoute>
            <Importe />
          </ProtectedRoute>
        )
    },
    {
        path: '/Visualizar/:numorca',
        element: (
          <ProtectedRoute>
            <VisualizarOrcamento />
          </ProtectedRoute>
        )
    },
    {
        path: '*',
        element: <Login />
    }
]);

const App = () => {
  return (
    <div>
      <RouterProvider router={router} />
    </div>
  )
}

export default App

