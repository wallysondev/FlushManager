import React from 'react';
import { Navigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  try {
    const decodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000; // em segundos

    if (decodedToken.exp && decodedToken.exp < currentTime) {
      // Token expirado
      localStorage.removeItem('token');
      return <Navigate to="/" replace />;
    }
  } catch (err) {
    // Token inválido
    localStorage.removeItem('token');
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
