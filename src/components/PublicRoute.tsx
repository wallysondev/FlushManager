import React from 'react';
import { Navigate } from 'react-router-dom';

// o public route verifica se estou logado, se sim ele me manda para a pagina principal
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (token) {
    return <Navigate to="/" replace />; // redireciona para página principal
  }

  return children;
};

export default PublicRoute;