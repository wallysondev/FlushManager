import {React, useState} from 'react'
import { useNavigate } from 'react-router-dom';
import './style.css';
import { AlertHiFire } from '../../components/Toast/AlertHiFire';

import Api from '../../services/api'

function Login() {
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate();

  async function SubmitOK(){
  try {
    const dados = {
      nome: username,
      password: password
    }
    
    // Checa se existe dados
    if (!username) return;

    const response = await Api.post(`/Token`, dados, {headers: {'Content-Type': 'application/json'}});

    // Verifica se veio token no response
    if (!response.data.token) {
      // Insere no alerta de mensagem 
      ShowMessage(true, "Não foi possivel realizar o login.");
      return;
    }

    // Armazena o token
    localStorage.setItem('token', response.data.token);

    // Redireciona o usuário
    navigate('/Home');

    } catch (error) {
      if (error.response) {
        var data = error.response.data;
        ShowMessage(true, data.message)
      }
    }
  }

  function ShowMessage(isVisible, texto) {
    setAlertMessage(texto);
    setShowAlert(isVisible);
  }

  // "w-full rounded px-3 py-2 text-sm border border-indigo-300 focus:outline-indigo-500 mb-4"
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Painel de Acesso</h2>
        {showAlert && <AlertHiFire description={alertMessage} />}
        <form className="space-y-4" onSubmit={e => {e.preventDefault(); SubmitOK(); }}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome de usuario</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              
              className="w-full px-3 py-2 border border-sky-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
              placeholder="digite seu usuario"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha de acesso</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-sky-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className=" border-gray-300 text-sky-600 focus:ring-sky-500"/>
              <span className="ml-2 text-sm text-gray-600">Lembrar-me</span>
            </label>
            <a href="#" className="text-sm text-sky-600 hover:text-sky-500">Esqueceu a senha?</a>
          </div>

          <button className="w-full text-sm bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 transition-colors" type='submit'>
            Acessar
          </button>
        </form>
      </div>
    </div>  
  )
}

export default Login
