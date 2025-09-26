import { faker } from '@faker-js/faker';
import { Removal, RemovalStatus } from '../types';

export const mockDrivers = [
  { id: 'motorista_1', name: 'Fernando', email: 'motorista@gmail.com', phone: '41984938295' },
  { id: 'motorista_2', name: 'Mariana Lima', email: 'motorista2@example.com', phone: '41999998888' },
  { id: 'motorista_3', name: 'Ricardo Andrade', email: 'motorista3@example.com', phone: '41977776666' },
];

export const generateMockRemovals = (): Removal[] => {
    const mockRemovals: Removal[] = [];
    const statuses: RemovalStatus[] = [
      'solicitada', 'agendada', 'concluida', 'aguardando_boleto', 'pagamento_concluido', 'cancelada', 
      'em_andamento', 'a_caminho', 'removido', 'finalizada', 'aguardando_baixa_master'
    ];
    const owners = ['clinic_456', 'pf_123'];
    const drivers = [
        { id: 'motorista_1', name: 'Fernando', phone: '41984938295' },
        { id: 'motorista_2', name: 'Mariana Lima', phone: '41999998888' },
    ];

    // Gerar 2 remoções para o Financeiro Junior (Coletivo)
    for (let i = 0; i < 2; i++) {
        mockRemovals.push({
            code: `FINJR_COLETIVO_${i+1}`,
            createdById: 'clinic_456',
            clinicName: 'Clínica Amigo Fiel',
            modality: 'coletivo',
            tutor: { name: faker.person.fullName(), cpfOrCnpj: faker.finance.accountNumber(11), phone: faker.phone.number(), email: faker.internet.email() },
            pet: { name: faker.animal.cat(), species: 'gato', breed: 'SRD', gender: 'femea', weight: '0-5kg', causeOfDeath: 'Natural' },
            removalAddress: { street: faker.location.streetAddress(), city: 'Curitiba', state: 'PR', cep: '81000-100', number: '100', neighborhood: 'Bairro' },
            additionals: [],
            paymentMethod: 'pix',
            value: 207.00,
            observations: 'Tutor ciente do processo coletivo.',
            requestType: 'agora',
            status: 'aguardando_financeiro_junior',
            history: [
                { date: faker.date.past().toISOString(), action: 'Solicitação criada', user: 'Clínica Amigo Fiel' },
                { date: faker.date.recent().toISOString(), action: 'Encaminhado para Financeiro Junior', user: 'Operacional (Teste)' },
            ],
            createdAt: faker.date.recent({ days: 2 }).toISOString(),
            realWeight: 4.8,
            contactedByFinance: false,
        });
    }

    // Gerar 2 remoções para o Financeiro Junior (Individual)
    for (let i = 0; i < 2; i++) {
        mockRemovals.push({
            code: `FINJR_INDIVIDUAL_${i+1}`,
            createdById: 'pf_123',
            modality: i % 2 === 0 ? 'individual_ouro' : 'individual_prata',
            tutor: { name: faker.person.fullName(), cpfOrCnpj: faker.finance.accountNumber(11), phone: faker.phone.number(), email: faker.internet.email() },
            pet: { name: faker.animal.dog(), species: 'cachorro', breed: 'Golden Retriever', gender: 'macho', weight: '21-40kg', causeOfDeath: 'Idade avançada' },
            removalAddress: { street: faker.location.streetAddress(), city: 'Curitiba', state: 'PR', cep: '80000-000', number: '123', neighborhood: 'Centro' },
            additionals: [],
            paymentMethod: 'credito',
            value: i % 2 === 0 ? 999.00 : 850.00,
            observations: 'Aguardando contato para agendamento da despedida.',
            requestType: 'agora',
            status: 'aguardando_financeiro_junior',
            history: [
                { date: faker.date.past().toISOString(), action: 'Solicitação criada', user: 'Tutor (Teste)' },
                { date: faker.date.recent().toISOString(), action: 'Encaminhado para Financeiro Junior', user: 'Operacional (Teste)' },
            ],
            createdAt: faker.date.recent({ days: 3 }).toISOString(),
            realWeight: 35,
            petCondition: 'Corpo em bom estado, mantido refrigerado.',
            farewellSchedulingInfo: 'Tutor prefere horários na parte da tarde.',
            contactedByFinance: false,
        });
    }

    // NOVOS DADOS PARA TESTE DO FINANCEIRO JUNIOR
    const testRemovalsForFinJr: Removal[] = [
        {
            code: `TESTE_FINJR_COLETIVO_FATURADO`,
            createdById: 'clinic_456',
            clinicName: 'Clínica Vet+',
            modality: 'coletivo',
            tutor: { name: 'Ana Paula', cpfOrCnpj: faker.finance.accountNumber(11), phone: faker.phone.number(), email: faker.internet.email() },
            pet: { name: 'Frajola', species: 'gato', breed: 'SRD', gender: 'macho', weight: '0-5kg', causeOfDeath: 'Atropelamento' },
            removalAddress: { street: faker.location.streetAddress(), city: 'Curitiba', state: 'PR', cep: '81000-100', number: '250', neighborhood: 'Água Verde' },
            additionals: [],
            paymentMethod: 'faturado',
            value: 207.00,
            observations: 'Remoção faturada para clínica.',
            requestType: 'agora',
            status: 'aguardando_financeiro_junior',
            history: [
                { date: faker.date.recent({days: 1}).toISOString(), action: 'Encaminhado para Financeiro Junior', user: 'Operacional (Teste)' },
            ],
            createdAt: faker.date.recent({ days: 2 }).toISOString(),
            realWeight: 3.2,
            contactedByFinance: true,
        },
        {
            code: `TESTE_FINJR_INDIVIDUAL_SEM_CONTATO`,
            createdById: 'pf_123',
            modality: 'individual_prata',
            tutor: { name: 'Carlos Eduardo', cpfOrCnpj: faker.finance.accountNumber(11), phone: faker.phone.number(), email: faker.internet.email() },
            pet: { name: 'Rex', species: 'cachorro', breed: 'Pastor Alemão', gender: 'macho', weight: '21-40kg', causeOfDeath: 'Insuficiência renal' },
            removalAddress: { street: faker.location.streetAddress(), city: 'Curitiba', state: 'PR', cep: '80000-000', number: '456', neighborhood: 'Batel' },
            additionals: [],
            paymentMethod: 'pix',
            value: 850.00,
            observations: 'Tutor muito abalado, aguardando contato.',
            requestType: 'agora',
            status: 'aguardando_financeiro_junior',
            history: [
                 { date: faker.date.recent({days: 1}).toISOString(), action: 'Encaminhado para Financeiro Junior', user: 'Operacional (Teste)' },
            ],
            createdAt: faker.date.recent({ days: 1 }).toISOString(),
            realWeight: 38,
            petCondition: 'Corpo em bom estado.',
            farewellSchedulingInfo: 'Tutor solicitou contato para agendar despedida.',
            contactedByFinance: false,
        },
        {
            code: `TESTE_FINJR_FINALIZADA`,
            createdById: 'pf_123',
            modality: 'individual_ouro',
            tutor: { name: 'Mariana Costa', cpfOrCnpj: faker.finance.accountNumber(11), phone: faker.phone.number(), email: faker.internet.email() },
            pet: { name: 'Luna', species: 'gato', breed: 'Siamês', gender: 'femea', weight: '0-5kg', causeOfDeath: 'Idade' },
            removalAddress: { street: faker.location.streetAddress(), city: 'Curitiba', state: 'PR', cep: '80000-000', number: '789', neighborhood: 'Cabral' },
            additionals: [],
            paymentMethod: 'credito',
            value: 500.00,
            observations: 'Tudo ok.',
            requestType: 'agora',
            status: 'aguardando_baixa_master',
            history: [
                { date: faker.date.past().toISOString(), action: 'Solicitação criada', user: 'Mariana Costa' },
                { date: faker.date.recent().toISOString(), action: `Financeiro Junior (Teste) finalizou e enviou para o Financeiro Master (PETCÈU)`, user: 'Financeiro Junior (Teste)' },
            ],
            createdAt: faker.date.recent({ days: 5 }).toISOString(),
            realWeight: 4.1,
            contactedByFinance: true,
            cremationCompany: 'PETCÈU',
        }
    ];
    mockRemovals.push(...testRemovalsForFinJr);


    // Gerar 3 remoções faturadas para a mesma clínica
    for (let i = 0; i < 3; i++) {
        const faturadoRemoval: Removal = {
            code: `FATURADO${i+1}`,
            createdById: 'clinic_456',
            clinicName: 'Clínica Vet Top (Teste)',
            modality: faker.helpers.arrayElement(['coletivo', 'individual_prata']),
            tutor: {
                name: faker.person.fullName(),
                cpfOrCnpj: faker.finance.accountNumber(11),
                phone: faker.phone.number(),
                email: faker.internet.email(),
            },
            pet: {
                name: faker.animal.cat(),
                species: 'gato',
                breed: 'SRD',
                gender: 'femea',
                weight: '0-5kg',
                causeOfDeath: 'Natural',
            },
            removalAddress: { street: faker.location.streetAddress(), city: 'Curitiba', state: 'PR', cep: '81000-100', number: '100', neighborhood: 'Bairro' },
            additionals: [],
            paymentMethod: 'faturado',
            value: faker.number.int({ min: 200, max: 400 }),
            observations: 'Cliente ciente do faturamento mensal.',
            requestType: 'agora',
            status: 'aguardando_baixa_master', // Começa aqui para o Financeiro Master agrupar
            history: [
                { date: faker.date.past().toISOString(), action: 'Solicitação criada por Clínica Vet Top (Teste)', user: 'Clínica Vet Top (Teste)' },
                { date: faker.date.recent().toISOString(), action: 'Receptor Taiane encaminhou para o motorista Fernando', user: 'Taiane (Receptor)' },
                { date: faker.date.recent().toISOString(), action: 'Motorista Fernando finalizou a remoção', user: 'Fernando (Motorista)' },
                { date: faker.date.recent().toISOString(), action: 'Financeiro Junior finalizou e enviou para o Financeiro Master (SQP)', user: 'Financeiro Junior (Teste)' },
            ],
            createdAt: faker.date.recent({ days: 15 }).toISOString(),
            assignedDriver: drivers[0],
            realWeight: 4.5,
            contactedByFinance: true,
            cremationCompany: 'SQP',
        };
        mockRemovals.push(faturadoRemoval);
    }
    
    // Gerar 3 remoções coletivas para a aba "Pendentes Coletivos" do Operacional
    for (let i = 0; i < 3; i++) {
        const coletivoPendente: Removal = {
            code: `COLETIVO_OP_${i+1}`,
            createdById: 'clinic_456',
            clinicName: 'Clínica Parceira (Teste)',
            modality: 'coletivo',
            tutor: {
                name: faker.person.fullName(),
                cpfOrCnpj: faker.finance.accountNumber(11),
                phone: faker.phone.number(),
                email: faker.internet.email(),
            },
            pet: {
                name: faker.animal.dog(),
                species: 'cachorro',
                breed: 'SRD',
                gender: faker.helpers.arrayElement(['macho', 'femea']),
                weight: '11-20kg',
                causeOfDeath: 'Natural',
            },
            removalAddress: { street: faker.location.streetAddress(), city: 'São José dos Pinhais', state: 'PR', cep: '83005-000', number: `${i+1}00`, neighborhood: 'Centro' },
            additionals: [],
            paymentMethod: 'pix',
            value: 255,
            observations: `Exemplo de remoção coletiva pendente para o operacional ${i+1}.`,
            requestType: 'agora',
            status: 'concluida',
            history: [
                { date: faker.date.past({ days: 2 }).toISOString(), action: 'Solicitação criada pela Clínica Parceira', user: 'Clínica Parceira' },
                { date: faker.date.past({ days: 1 }).toISOString(), action: 'Receptor encaminhou para o motorista', user: 'Receptor (Teste)' },
                { date: faker.date.recent().toISOString(), action: 'Motorista finalizou a remoção e pesagem', user: 'Motorista (Teste)' },
            ],
            createdAt: faker.date.past({ days: 2 }).toISOString(),
            assignedDriver: drivers[i % drivers.length],
            realWeight: faker.number.int({ min: 12, max: 18 }),
            contactedByFinance: false,
        };
        mockRemovals.push(coletivoPendente);
    }

    // Gerar 5 remoções individuais finalizadas para o cremador
    for (let i = 0; i < 5; i++) {
        mockRemovals.push({
            code: `CREM_${i+1}`,
            createdById: 'pf_123',
            modality: 'individual_prata',
            tutor: { name: faker.person.fullName(), cpfOrCnpj: faker.finance.accountNumber(11), phone: faker.phone.number(), email: faker.internet.email() },
            pet: { name: faker.animal.dog(), species: 'cachorro', breed: 'SRD', gender: 'macho', weight: '6-10kg', causeOfDeath: 'Natural' },
            removalAddress: { street: faker.location.streetAddress(), city: 'Curitiba', state: 'PR', cep: '80000-000', number: '123', neighborhood: 'Centro' },
            additionals: [],
            paymentMethod: 'pix',
            value: 780,
            observations: 'Aguardando cremação.',
            requestType: 'agora',
            status: 'finalizada',
            history: [
                { date: faker.date.past().toISOString(), action: 'Solicitação criada', user: 'Tutor' },
                { date: faker.date.recent().toISOString(), action: 'Liberado para cremação pelo Operacional', user: 'Operacional (Teste)' },
            ],
            createdAt: faker.date.recent({ days: 4 }).toISOString(),
            realWeight: 8.5,
            contactedByFinance: true,
            cremationCompany: 'PETCÈU',
        });
    }

    // Gerar outras remoções
    for (let i = 0; i < 50; i++) {
      const ownerId = owners[i % owners.length];
      const status = statuses[i % statuses.length];
      const modality = faker.helpers.arrayElement(['coletivo', 'individual_prata', 'individual_ouro']);
      const paymentMethod = status.includes('faturado') || status === 'aguardando_boleto' ? 'faturado' : faker.helpers.arrayElement(['credito', 'pix', 'dinheiro', 'link_pagamento']);
      
      const history = [{ date: faker.date.past().toISOString(), action: `Solicitação criada por ${ownerId === 'clinic_456' ? 'Clínica Vet Top' : 'João da Silva'}`, user: ownerId === 'clinic_456' ? 'Clínica Vet Top' : 'João da Silva' }];
      let assignedDriver;
      let cremationCompany;

      if (['em_andamento', 'a_caminho', 'removido', 'concluida', 'finalizada', 'aguardando_baixa_master'].includes(status)) {
        assignedDriver = drivers[i % drivers.length];
        history.push({
            date: faker.date.recent().toISOString(),
            action: `Receptor Taiane encaminhou para o motorista ${assignedDriver.name}`,
            user: 'Taiane (Receptor)'
        });
      }
      if (['a_caminho', 'removido', 'concluida', 'finalizada', 'aguardando_baixa_master'].includes(status) && assignedDriver) {
        history.push({
            date: faker.date.recent().toISOString(),
            action: `Motorista ${assignedDriver.name} iniciou o deslocamento`,
            user: `${assignedDriver.name} (Motorista)`
        });
      }
      if (['removido', 'concluida', 'finalizada', 'aguardando_baixa_master'].includes(status) && assignedDriver) {
        history.push({
            date: faker.date.recent().toISOString(),
            action: `Motorista ${assignedDriver.name} removeu o pet no endereço`,
            user: `${assignedDriver.name} (Motorista)`
        });
      }
      if (['concluida', 'finalizada', 'aguardando_baixa_master'].includes(status) && assignedDriver) {
        history.push({
            date: faker.date.recent().toISOString(),
            action: `Motorista ${assignedDriver.name} pesou o pet e finalizou a remoção`,
            user: `${assignedDriver.name} (Motorista)`
        });
      }
      if (status === 'aguardando_baixa_master' && assignedDriver) {
        cremationCompany = faker.helpers.arrayElement(['PETCÈU', 'SQP']);
        history.push({
            date: faker.date.recent().toISOString(),
            action: `Financeiro Junior (Teste) finalizou e enviou para o Financeiro Master (${cremationCompany})`,
            user: `Financeiro Junior (Teste)`
        });
      }

      const removal: Removal = {
        code: `MOCK${i.toString().padStart(4, '0')}`,
        createdById: ownerId,
        clinicName: ownerId === 'clinic_456' ? 'Clínica Vet Top (Teste)' : undefined,
        modality: modality,
        tutor: {
          name: faker.person.fullName(),
          cpfOrCnpj: faker.finance.accountNumber(11),
          phone: faker.phone.number(),
          email: faker.internet.email(),
        },
        pet: {
          name: faker.animal.dog(),
          species: faker.helpers.arrayElement(['cachorro', 'gato']),
          breed: faker.animal.dog(),
          gender: faker.helpers.arrayElement(['macho', 'femea']),
          weight: faker.helpers.arrayElement(['0-5kg', '6-10kg', '11-20kg']),
          causeOfDeath: 'Causas naturais',
        },
        removalAddress: {
          street: faker.location.streetAddress(),
          city: 'Curitiba',
          state: 'PR',
          cep: faker.location.zipCode(),
          number: faker.location.buildingNumber(),
          neighborhood: faker.location.secondaryAddress(),
        },
        additionals: [],
        paymentMethod: paymentMethod,
        value: faker.number.int({ min: 150, max: 800 }),
        observations: faker.lorem.sentence(),
        requestType: status === 'agendada' ? 'agendar' : 'agora',
        status: status,
        history: history,
        createdAt: faker.date.past().toISOString(),
        paymentProof: (paymentMethod === 'pix' || paymentMethod === 'link_pagamento') ? 'comprovante_mock.pdf' : undefined,
        cancellationReason: status === 'cancelada' ? 'Solicitado pelo tutor.' : undefined,
        assignedDriver: assignedDriver,
        realWeight: ['concluida', 'finalizada', 'aguardando_baixa_master'].includes(status) ? faker.number.int({ min: 5, max: 20}) : undefined,
        contactedByFinance: faker.datatype.boolean({ probability: 0.1 }),
        cremationCompany: cremationCompany,
      };
      mockRemovals.push(removal);
    }
    return mockRemovals;
};
