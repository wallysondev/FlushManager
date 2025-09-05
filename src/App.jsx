import React from 'react'
import { Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Importe from './pages/Importe'
import VisualizarOrcamento from './pages/Visualizar';
import Perfil from './pages/Gerenciar/Perfil';
import Permissao from './pages/Gerenciar/Permissao';

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

const router = createBrowserRouter([
    {
      // Aqui verifica
      path: '/',
      // Quando coloca somente / na URL ele valida se esta logado, se sim manda para  HOME se não Fica em Login
      element: ( localStorage.getItem("token")  ? <Navigate to="/Home" replace /> : <Navigate to="/Login" replace />
      )
    },
    {
      // É uma rota que qualquer pessoa pode acessar sem precisar ter um token ou permissao.
      path: '/Login',
      element: (
        <PublicRoute>
          <Login />
        </PublicRoute>
      ),
    },
    // Só pode acessar com as permissões abaixo
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
        path: '/Gerenciar/Perfil',
        element: (
          <ProtectedRoute>
            <Perfil />
          </ProtectedRoute>
        )
    },
        {
        path: '/Gerenciar/Permissao',
        element: (
          <ProtectedRoute>
            <Permissao />
          </ProtectedRoute>
        )
    },
    // Qualquer coisa que nao exista vai para / que manda para home ou login se tiver logado.
    {
      path: '*',
      element: <Navigate to="/" replace />
    },
]);

const App = () => {
  return (
    <div>
      <RouterProvider router={router} />
    </div>
  )
}

export default App

