export interface Driver {
  id?: string;
  name: string;
  registrationNumber: string;
  phone: string;
  status: 'actif' | 'inactif';
}

export interface Client {
  id?: string;
  name: string;
  address: string;
  contactPerson: string;
  phone: string;
}

export interface Pickup {
  id?: string;
  date: string;
  blNumber: string;
  tcNumber: string;
  productNature: string;
  driverId: string;
  clientId: string;
  registrationNumber: string;
  hhDate: string;
  status: 'en_attente' | 'termine';
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  companyName: string;
}
