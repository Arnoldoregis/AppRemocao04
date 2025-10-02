import React from 'react';
import { Removal, RemovalStatus } from '../types';
import { format } from 'date-fns';
import { List, Clock, CheckCircle, FileWarning, FileCheck, XCircle, Files, Eye, Send, Flame, PackageCheck, UserCheck, CalendarClock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface RemovalCardProps {
  removal: Removal;
  onClick: () => void;
}

// Config for status badge
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
  pronto_para_entrega: { color: 'pink', icon: PackageCheck, label: 'Pronto p/ Entrega' },
  aguardando_retirada: { color: 'orange', icon: UserCheck, label: 'Aguardando Retirada' },
  entrega_agendada: { color: 'cyan', icon: CalendarClock, label: 'Entrega Agendada' },
};

// New config for modality styling
const modalityConfig: { [key: string]: { style: string; label: string } } = {
  coletivo: { style: 'bg-green-200 text-green-800', label: 'Coletivo' },
  individual_prata: { style: 'bg-gray-300 text-gray-800', label: 'Individual Prata' },
  individual_ouro: { style: 'bg-amber-300 text-amber-800', label: 'Individual Ouro' },
  '': { style: 'bg-gray-200 text-gray-800', label: 'Não Definida' }
};

const RemovalCard: React.FC<RemovalCardProps> = ({ removal, onClick }) => {
  const { user } = useAuth();

  const isContactedByFinance = user?.role === 'financeiro_junior' && removal.contactedByFinance;

  const statusStyle = statusConfig[removal.status] || { color: 'gray', icon: Files, label: 'Desconhecido' };
  const StatusIcon = statusStyle.icon;
  const displayColor = isContactedByFinance ? 'green' : statusStyle.color;

  const modalityStyle = modalityConfig[removal.modality] || modalityConfig[''];

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 transition-all hover:shadow-lg cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-gray-900">{removal.pet.name}</p>
          <p className="text-sm text-gray-600">Tutor: {removal.tutor.name}</p>
          <p className="text-xs text-gray-400">Código: {removal.code}</p>
        </div>
        <div className={`flex items-center text-sm font-medium text-${displayColor}-600 bg-${displayColor}-100 px-2 py-1 rounded-full`}>
          <StatusIcon className="h-4 w-4 mr-1" />
          {statusStyle.label}
        </div>
      </div>
      <div className="mt-4 text-sm space-y-2">
        <div>
            <span className={`${modalityStyle.style} font-semibold px-2 py-0.5 rounded-md`}>
                {modalityStyle.label}
            </span>
        </div>
        <p className="text-gray-800 pt-1"><strong>Valor:</strong> R$ {removal.value.toFixed(2)}</p>
        <p className="text-gray-700"><strong>Data:</strong> {format(new Date(removal.createdAt), 'dd/MM/yyyy HH:mm')}</p>
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
