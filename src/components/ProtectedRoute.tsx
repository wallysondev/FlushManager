import React from 'react';
import { Navigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/Login" replace />;
  }

  try {
    const decodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000; // em segundos

    // Verifica expiração
    if (decodedToken.exp && decodedToken.exp < currentTime) {
      localStorage.removeItem('token');
      return <Navigate to="/Login" replace />;
    }

    // Verifica role
    if (allowedRoles && !allowedRoles.includes(decodedToken.role)) {
      return <Navigate to="/Login" replace />; // ou página de acesso negado
    }

  } catch (err) {
    localStorage.removeItem('token');
    return <Navigate to="/Login" replace />;
  }

  return children;
};

export default ProtectedRoute;
