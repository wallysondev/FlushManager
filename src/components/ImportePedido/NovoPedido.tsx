import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Api from '../../services/api';
import {AlertHiFire} from '../../components/Toast/AlertHiFire';
import { jwtDecode } from 'jwt-decode';

export const NovoPedido = () => {
  const navigate = useNavigate();

  // estado para controlar se o alerta deve aparecer
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [numorca, setNumorca] = useState('');

  async function SubmitOK(){
    try {
      const token = localStorage.getItem('token');

      //console.log(token);

      if (!token) {
        console.log("erro no token")
        return;
      }

      const decodedToken = jwtDecode(token);
      console.log(decodedToken);
      const codusur = decodedToken.codusur;

      // Recupera do endpoint os dados referente a requisição do orçamento
      const response = await Api.post(`/DBSync/importarpedido?numorca=${numorca}&codusur=${codusur}`, {}, { headers: { Authorization: `Bearer ${token}` } })

      // Insere no alerta de mensagem 
      const data = response.data;
      ShowMessage(true, data.mensagem);

    } catch (error: any) {
      if (error.response) {
        // Insere no alerta de mensagem 
        const data = error.response.data;
        ShowMessage(true, data.mensagem);
      }
    }
  }

  function ShowMessage(IsVisible: boolean, Texto: string){
    setAlertMessage(Texto);
    setShowAlert(IsVisible);
  }

    return (
    <div className="min-h-screen  flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-xl p-8">
        {showAlert && <AlertHiFire description={alertMessage} />}
        <form className="space-y-4" onSubmit={e => {e.preventDefault(); SubmitOK(); }}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numero do Orçamento</label>
            <input 
              type="number" 
              value={numorca}
              onChange={e => setNumorca(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Digite todos os numeros"
            />
          </div>
          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors" type='submit'>
            Importar
          </button>
        </form>
      </div>
    </div>  
    );
}    
    
    
