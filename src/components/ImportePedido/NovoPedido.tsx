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
              type="text" 
              inputMode="numeric"   // abre teclado numérico em mobile
              pattern="[0-9]*"      // força só números
              value={numorca}
              onChange={e => setNumorca(e.target.value.replace(/\D/, ""))} // remove não números
              className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
              placeholder="Digite todos os números"
            />
          </div>
          <button className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 transition-colors" type='submit'>
            Importar
          </button>
        </form>
      </div>
    </div>  
    );
}    
    
    
