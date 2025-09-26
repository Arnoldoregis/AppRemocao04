import React from 'react';
import { Removal, RemovalStatus } from '../types';
import { format } from 'date-fns';
import { List, Clock, CheckCircle, FileWarning, FileCheck, XCircle, Files, Eye, Send, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface RemovalCardProps {
  removal: Removal;
  onClick: () => void;
}

const statusConfig: { [key in RemovalStatus]?: { color: string; icon: React.ElementType; label: string } } = {
  solicitada: { color: 'blue', icon: List, label: 'Solicitada' },
  agendada: { color: 'purple', icon: Clock, label: 'Agendada' },
  concluida: { color: 'green', icon: CheckCircle, label: 'Concluída' },
  aguardando_boleto: { color: 'orange', icon: FileWarning, label: 'Aguardando Boleto' },
  pagamento_concluido: { color: 'teal', icon: FileCheck, label: 'Pagamento Concluído' },
  cancelada: { color: 'red', icon: XCircle, label: 'Cancelada' },
  em_andamento: { color: 'yellow', icon: List, label: 'Em Andamento' },
  a_caminho: { color: 'yellow', icon: List, label: 'A Caminho' },
  removido: { color: 'indigo', icon: CheckCircle, label: 'Removido' },
  finalizada: { color: 'gray', icon: CheckCircle, label: 'Finalizada' },
  aguardando_baixa_master: { color: 'cyan', icon: Send, label: 'Aguardando Master' },
  aguardando_financeiro_junior: { color: 'orange', icon: FileWarning, label: 'Aguardando Fin. Jr.' },
  cremado: { color: 'gray', icon: Flame, label: 'Cremado' },
};

const RemovalCard: React.FC<RemovalCardProps> = ({ removal, onClick }) => {
  const { user } = useAuth();

  const isContactedByFinance = user?.role === 'financeiro_junior' && removal.contactedByFinance;

  const config = statusConfig[removal.status] || { color: 'gray', icon: Files, label: 'Desconhecido' };
  const Icon = config.icon;

  const displayColor = isContactedByFinance ? 'green' : config.color;

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 border-l-4 transition-all hover:shadow-lg hover:border-l-8 cursor-pointer" 
      style={{ borderColor: displayColor }}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-gray-800">{removal.pet.name}</p>
          <p className="text-sm text-gray-600">Tutor: {removal.tutor.name}</p>
          <p className="text-xs text-gray-400">Código: {removal.code}</p>
        </div>
        <div className={`flex items-center text-sm font-medium text-${displayColor}-600 bg-${displayColor}-100 px-2 py-1 rounded-full`}>
          <Icon className="h-4 w-4 mr-1" />
          {config.label}
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-700 space-y-1">
        <p><strong>Modalidade:</strong> {removal.modality.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
        <p><strong>Valor:</strong> R$ {removal.value.toFixed(2)}</p>
        <p><strong>Data:</strong> {format(new Date(removal.createdAt), 'dd/MM/yyyy HH:mm')}</p>
      </div>
      <div className="mt-3 flex justify-end">
        <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
            <Eye className="h-4 w-4 mr-1" />
            Ver Detalhes
        </button>
      </div>
    </div>
  );
};

export default RemovalCard;
