import { faker } from '@faker-js/faker';
import { Removal, RemovalStatus } from '../types';

export const mockDrivers = [
  { id: 'motorista_1', name: 'Fernando', email: 'motorista@gmail.com' },
  { id: 'motorista_2', name: 'Mariana Lima', email: 'motorista2@example.com' },
  { id: 'motorista_3', name: 'Ricardo Andrade', email: 'motorista3@example.com' },
];

export const generateMockRemovals = (): Removal[] => {
    const mockRemovals: Removal[] = [];
    const statuses: RemovalStatus[] = [
      'solicitada', 'agendada', 'concluida', 'aguardando_boleto', 'pagamento_concluido', 'cancelada', 
      'em_andamento', 'a_caminho', 'removido', 'finalizada', 'aguardando_baixa_master'
    ];
    const owners = ['clinic_456', 'pf_123'];
    const drivers = [
        { id: 'motorista_1', name: 'Fernando' },
        { id: 'motorista_2', name: 'Mariana Lima' },
    ];

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
                { date: faker.date.recent().toISOString(), action: 'Financeiro Junior finalizou e enviou para o Financeiro Master', user: 'Financeiro Junior (Teste)' },
            ],
            createdAt: faker.date.recent({ days: 15 }).toISOString(),
            assignedDriver: drivers[0],
            realWeight: 4.5,
        };
        mockRemovals.push(faturadoRemoval);
    }

    // Gerar outras remoções
    for (let i = 0; i < 50; i++) {
      const ownerId = owners[i % owners.length];
      const status = statuses[i % statuses.length];
      const modality = faker.helpers.arrayElement(['coletivo', 'individual_prata', 'individual_ouro']);
      const paymentMethod = status.includes('faturado') || status === 'aguardando_boleto' ? 'faturado' : faker.helpers.arrayElement(['credito', 'pix', 'dinheiro', 'link_pagamento']);
      
      const history = [{ date: faker.date.past().toISOString(), action: `Solicitação criada por ${ownerId === 'clinic_456' ? 'Clínica Vet Top' : 'João da Silva'}`, user: ownerId === 'clinic_456' ? 'Clínica Vet Top' : 'João da Silva' }];
      let assignedDriver;

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
        history.push({
            date: faker.date.recent().toISOString(),
            action: `Financeiro Junior (Teste) finalizou e enviou para o Financeiro Master`,
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
      };
      mockRemovals.push(removal);
    }
    return mockRemovals;
};
