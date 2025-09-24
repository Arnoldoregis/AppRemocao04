export interface User {
  id: string;
  email: string;
  name: string; // Nome da pessoa ou Nome Fantasia da clínica
  userType: 'pessoa_fisica' | 'clinica' | 'funcionario';
  role?: 'administrador' | 'receptor' | 'motorista' | 'financeiro_junior' | 'financeiro_master' | 'gerencia' | 'operacional';
  cpf?: string;
  cnpj?: string;
  phone: string;
  address: Address;
}

export interface Address {
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface Pet {
  name: string;
  species: 'cachorro' | 'gato' | 'roedor' | 'passaro' | 'outros' | '';
  breed: string;
  gender: 'macho' | 'femea' | '';
  weight: string;
  causeOfDeath: string;
}

export type RemovalStatus = 
  | 'solicitada'          // Cliente criou
  | 'recebida'            // Receptor viu
  | 'agendada'            // Cliente agendou
  | 'em_andamento'        // Receptor direcionou para motorista
  | 'a_caminho'           // Motorista aceitou
  | 'removido'            // Motorista coletou o pet
  | 'concluida'           // Motorista pesou e finalizou -> Agora vai para o Operacional
  | 'aguardando_financeiro_junior' // Operacional finalizou -> Vai para o Financeiro Jr.
  | 'aguardando_baixa_master' // Financeiro Jr. finalizou -> Vai para o Master
  | 'aguardando_pagamento'// Financeiro Master gerou boleto
  | 'pagamento_concluido' // Cliente pagou boleto / Fin Master confirmou
  | 'cancelada'           // Cancelado em alguma etapa
  | 'finalizada'          // Ciclo encerrado pelo Financeiro
  | 'aguardando_boleto'   // Status para a visão da clínica
  | 'coletivo_pago'
  | 'individual_pago'
  | 'coletivo_faturado'
  | 'individual_faturado';


export interface Removal {
  code: string;
  createdById: string; // ID do usuário (PF ou Clínica) que criou
  clinicName?: string; // Nome da clínica, se aplicável
  modality: 'coletivo' | 'individual_prata' | 'individual_ouro' | '';
  tutor: {
    cpfOrCnpj: string;
    name: string;
    phone: string;
    email: string;
  };
  pet: Pet;
  removalAddress: Address;
  additionals: Additional[];
  customAdditionals?: CustomAdditional[];
  paymentMethod: 'faturado' | 'debito' | 'credito' | 'pix' | 'link_pagamento' | 'dinheiro' | 'plano_preventivo' | '';
  value: number;
  observations: string;
  requestType: 'agora' | 'agendar';
  scheduledDate?: string;
  scheduledTime?: string;
  schedulingReason?: string;
  status: RemovalStatus;
  history: RemovalHistory[];
  realWeight?: number;
  contractNumber?: string;
  paymentProof?: string; // URL ou path do arquivo
  cancellationReason?: string;
  createdAt: string; // Data de criação da solicitação
  assignedDriver?: {
    id: string;
    name: string;
  };
  boletoUrl?: string;
  comprovanteFaturaUrl?: string;
  adjustmentConfirmed?: boolean;
  petCondition?: string;
  farewellSchedulingInfo?: string;
  cremationDate?: string;
  certificateObservations?: string;
  contactedByFinance?: boolean;
}

export interface Additional {
  type: 'patinha_resina' | 'relicario' | 'carteirinha_pelinho';
  quantity: number;
  value: number;
}

export interface CustomAdditional {
  id: string;
  name: string;
  value: number;
  paymentProof?: string;
}

export interface RemovalHistory {
  date: string;
  action: string;
  user: string;
  reason?: string;
  proofUrl?: string;
}

export interface LoteFaturamento {
  id: string; // e.g., 'clinic_456-2025-07'
  clinicId: string;
  clinicName: string;
  removals: Removal[];
  totalValue: number;
  status: 'aguardando_geracao_boleto' | 'aguardando_pagamento_clinica' | 'pagamento_em_confirmacao' | 'concluido';
  boletoUrl?: string;
  comprovanteUrl?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  attachment?: {
    name: string;
    url: string;
  };
}

export interface Conversation {
  id: string; // Corresponds to client's userId
  clientName: string;
  messages: ChatMessage[];
  unreadByReceptor: number;
  unreadByClient: number;
  lastMessageTimestamp: string;
}

export interface FarewellSchedule {
  [slotKey: string]: Removal; // key is "YYYY-MM-DD-HH:mm" or "YYYY-MM-DD-ENCAIXE EMERGÊNCIA"
}
