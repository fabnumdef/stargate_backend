import {
  REQUEST01,
  ownerSAM01,
} from './request';

const VISITOR01 = {
  owner: ownerSAM01,
  object: 'PROFESSIONAL',
  reason: 'mon motif',
  from: '2024-02-26T11:30:19.422Z',
  to: '2024-02-27T11:30:19.422Z',
  nid: '',
  firstname: 'Sylverster',
  birthLastname: 'Stallone',
  usageLastname: '',
  isInternal: true,
  employeeType: 'TYPE_INTERIM',
  company: 'Expendable',
  workPlace: 'Hollywood',
  rank: '',
  email: 'cu.ciri@localhost.fr',
  vip: true,
  vipReason: 'Je suis important',
  nationality: 'Française',
  identityDocuments: [{
    kind: 'CIMSCard',
    reference: '1234567891',
  }],
  birthday: '1994-07-19T22:00:00.000Z',
  birthplace: 'Marseille',
  status: 'DRAFTED',
  request: REQUEST01,
};

const VISITOR02 = {
  owner: ownerSAM01,
  object: 'PROFESSIONAL',
  reason: 'mon motif',
  from: '2024-02-26T11:30:19.422Z',
  to: '2024-02-27T11:30:19.422Z',
  nid: '',
  firstname: 'Arnold',
  birthLastname: 'Schwarzenegger',
  usageLastname: '',
  isInternal: true,
  employeeType: 'TYPE_VISITOR',
  company: 'Expendable',
  workPlace: 'Hollywood',
  rank: '',
  email: 'cu.ciri@localhost.fr',
  vip: true,
  vipReason: 'Je suis important',
  nationality: 'Française',
  identityDocuments: [{
    kind: 'CIMSCard',
    reference: '1987654321',
  }],
  birthday: '1947-07-30T22:00:00.000Z',
  birthplace: 'Thal (AUTRICHE)',
  status: 'DRAFTED',
  request: REQUEST01,
};

export default async () => [
  VISITOR01,
  VISITOR02,
];
