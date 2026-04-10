import { format, parseISO, isSameDay } from 'date-fns';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const generateId = () => Math.random().toString(36).substr(2, 9);

const DB_KEY = 'agendapro_db';

interface DBState {
  users: User[];
  businesses: Business[];
  services: Service[];
  professionals: Professional[];
  appointments: Appointment[];
}

const getDB = (): DBState => {
  const data = localStorage.getItem(DB_KEY);
  if (data) {
    return JSON.parse(data);
  }
  return seedDB();
};

const saveDB = (state: DBState) => {
  localStorage.setItem(DB_KEY, JSON.stringify(state));
};

const seedDB = (): DBState => {
  const adminId = generateId();
  const businessId = 'biz_1'; // Use a predictable ID so landing page booking links `/booking/biz_1` works if it's hardcoded anywhere.
  
  const initialState: DBState = {
    users: [
      {
        id: adminId,
        name: 'Admin AgendaPro',
        email: 'admin@agendapro.com',
        role: 'admin',
        created_at: new Date().toISOString()
      }
    ],
    businesses: [
      {
        id: businessId,
        name: 'Studio Beleza VIP',
        description: 'O melhor estúdio de beleza automotiva, mentira, é cabeleireiro mesmo.',
        address: 'Rua Principal, 100',
        phone: '11999999999',
        email: 'contato@studiovip.com',
        owner_id: adminId,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    services: [
      {
        id: generateId(),
        business_id: businessId,
        name: 'Corte Social',
        description: 'Corte tradicional de cabelo.',
        duration: 30,
        price: 45.0,
        color: '#7C3AED',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: generateId(),
        business_id: businessId,
        name: 'Design de Sobrancelha',
        description: 'Design feito na pinça e tesoura.',
        duration: 45,
        price: 35.0,
        color: '#10B981',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    professionals: [
      {
        id: generateId(),
        user_id: generateId(),
        business_id: businessId,
        name: 'Carlos Barbeiro',
        specialty: 'Barbeiro Sênior',
        email: 'carlos@studiovip.com',
        phone: '11988888888',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: generateId(),
        user_id: generateId(),
        business_id: businessId,
        name: 'Ana Designer',
        specialty: 'Designer de Sobrancelha',
        email: 'ana@studiovip.com',
        phone: '11977777777',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    appointments: []
  };

  const profs = initialState.professionals;
  const servs = initialState.services;
  
  // Seed past and future
  for(let i = 0; i < 20; i++) {
    const isPast = i < 10;
    const date = new Date();
    if (isPast) {
      date.setDate(date.getDate() - (10 - i));
    } else {
      date.setDate(date.getDate() + (i - 9));
    }
    
    // Mix times
    const hours = ['09:00', '10:00', '14:00', '15:30', '16:00', '17:00'];
    const selectedTime = hours[i % hours.length];
    
    const prof = profs[i % 2];
    const srv = servs[i % 2];
    
    initialState.appointments.push({
      id: generateId(),
      business_id: businessId,
      client_id: `cli_${i}`,
      client_name: `João Cliente ${i}`,
      client_email: `joao${i}@email.com`,
      client_phone: '(11) 9' + String(Math.floor(Math.random() * 90000000) + 10000000),
      professional_id: prof.id,
      professional_name: prof.name,
      service_id: srv.id,
      service_name: srv.name,
      date: date.toISOString(),
      time: selectedTime,
      duration: srv.duration,
      price: srv.price,
      status: isPast ? 'completed' : 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  localStorage.setItem(DB_KEY, JSON.stringify(initialState));
  localStorage.setItem('token', 'fake-jwt-token');
  localStorage.setItem('user', JSON.stringify(initialState.users[0]));
  
  return initialState;
};

const mockResponse = <T>(data: T) => delay(500).then(() => ({ data }));

export const authAPI = {
  login: async (_email: string, _password: string) => {
    await delay(800);
    const db = getDB();
    const user = db.users[0] || seedDB().users[0];
    localStorage.setItem('token', 'fake-jwt-token');
    localStorage.setItem('user', JSON.stringify(user));
    return { data: { token: 'fake-jwt-token', user } };
  },
  
  register: async (_data: any) => mockResponse({ user: getDB().users[0] || seedDB().users[0], token: 'fake-jwt-token' }),
  
  me: async () => {
    const u = localStorage.getItem('user');
    if (!u) {
      const db = getDB();
      const user = db.users[0];
      localStorage.setItem('user', JSON.stringify(user));
      return mockResponse({ user });
    }
    return mockResponse({ user: JSON.parse(u) });
  },
  
  updateProfile: async (data: any) => {
    const db = getDB();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    user.name = data.name || user.name;
    user.phone = data.phone || user.phone;
    localStorage.setItem('user', JSON.stringify(user));
    
    const dbUserIdx = db.users.findIndex(u => u.id === user.id);
    if(dbUserIdx >= 0) {
        db.users[dbUserIdx] = user;
        saveDB(db);
    }
    return mockResponse({ user });
  },
  
  changePassword: async () => mockResponse({ success: true }),
};

export const businessAPI = {
  create: async (data: Partial<Business>) => {
    const db = getDB();
    const b: Business = { 
      ...data, 
      id: generateId(), 
      active: true, 
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString(),
      name: data.name!,
      owner_id: '1'
    };
    db.businesses.push(b);
    saveDB(db);
    return mockResponse(b);
  },
  
  list: async () => {
    const db = getDB();
    return mockResponse({ businesses: db.businesses });
  },
  
  getById: async (id: string) => {
    const db = getDB();
    return mockResponse({ business: db.businesses.find(b => b.id === id) });
  },
  
  update: async (id: string, data: Partial<Business>) => {
    const db = getDB();
    const idx = db.businesses.findIndex(b => b.id === id);
    if (idx !== -1) {
      db.businesses[idx] = { ...db.businesses[idx], ...data, updated_at: new Date().toISOString() };
      saveDB(db);
    }
    return mockResponse(db.businesses[idx]);
  },
  
  delete: async (id: string) => {
    const db = getDB();
    db.businesses = db.businesses.filter(b => b.id !== id);
    saveDB(db);
    return mockResponse({ success: true });
  },
  
  dashboard: async (id: string, _params?: { startDate?: string; endDate?: string }) => {
    const db = getDB();
    const apts = db.appointments.filter(a => a.business_id === id);
    
    const totalAppointments = apts.length;
    const periodAppointments = apts.filter(a => isSameDay(new Date(a.date), new Date())).length;
    const uniqueClients = new Set(apts.map(a => a.client_id)).size;
    const revenue = apts.reduce((sum, apt) => sum + (apt.status === 'completed' || apt.status === 'confirmed' ? apt.price : 0), 0);
    
    return mockResponse({
      totalAppointments,
      periodAppointments,
      uniqueClients,
      revenue
    });
  },
};

export const serviceAPI = {
  create: async (data: Partial<Service>) => {
    const db = getDB();
    const s: Service = {
      ...data,
      id: generateId(),
      name: data.name!,
      business_id: data.business_id!,
      duration: data.duration!,
      price: data.price!,
      color: data.color || '#7C3AED',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.services.push(s);
    saveDB(db);
    return mockResponse(s);
  },
  
  list: async (businessId?: string) => {
    const db = getDB();
    const services = businessId ? db.services.filter(s => s.business_id === businessId) : db.services;
    return mockResponse({ services });
  },
  
  getById: async (id: string) => mockResponse(getDB().services.find(s => s.id === id)),
  
  update: async (id: string, data: Partial<Service>) => {
    const db = getDB();
    const idx = db.services.findIndex(s => s.id === id);
    if (idx !== -1) {
      db.services[idx] = { ...db.services[idx], ...data, updated_at: new Date().toISOString() };
      saveDB(db);
    }
    return mockResponse(db.services[idx]);
  },
  
  delete: async (id: string) => {
    const db = getDB();
    db.services = db.services.filter(s => s.id !== id);
    saveDB(db);
    return mockResponse({ success: true });
  },
};

export const professionalAPI = {
  create: async (data: Partial<Professional> & { service_ids?: string[] }) => {
    const db = getDB();
    const p: Professional = {
      ...data,
      id: generateId(),
      user_id: generateId(),
      business_id: data.business_id!,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.professionals.push(p);
    saveDB(db);
    return mockResponse(p);
  },
  
  list: async (businessId?: string) => {
    const db = getDB();
    const professionals = businessId ? db.professionals.filter(p => p.business_id === businessId) : db.professionals;
    return mockResponse({ professionals });
  },
  
  getById: async (id: string) => mockResponse(getDB().professionals.find(p => p.id === id)),
  
  update: async (id: string, data: Partial<Professional>) => {
    const db = getDB();
    const idx = db.professionals.findIndex(p => p.id === id);
    if(idx !== -1) {
      db.professionals[idx] = { ...db.professionals[idx], ...data, updated_at: new Date().toISOString() };
      saveDB(db);
    }
    return mockResponse(db.professionals[idx]);
  },
  
  delete: async (id: string) => {
    const db = getDB();
    db.professionals = db.professionals.filter(p => p.id !== id);
    saveDB(db);
    return mockResponse({ success: true });
  },
  
  addAvailability: async () => mockResponse({success: true}),
  removeAvailability: async () => mockResponse({success: true}),
  
  getAvailableSlots: async (id: string, date: string, _serviceId?: string) => {
    // Retorna slots filtrados baseado na ocupação do dia para o profissional.
    const db = getDB();
    const apts = db.appointments.filter(a => a.professional_id === id && isSameDay(new Date(a.date), parseISO(date)) && a.status !== 'cancelled');
    
    const allSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
    const takenSlots = apts.map(a => a.time);
    const available = allSlots.filter(s => !takenSlots.includes(s));
    
    return mockResponse({ slots: available });
  },
};

export const appointmentAPI = {
  create: async (data: Partial<Appointment>) => {
    const db = getDB();
    const srv = db.services.find(s => s.id === data.service_id);
    const prof = db.professionals.find(p => p.id === data.professional_id);

    // Motor anti-colisão: verifica se há consulta ativa (not cancelled) 
    // com este profissional neste dia e horário.
    if (data.professional_id) {
       const conflict = db.appointments.find(a => 
         a.professional_id === data.professional_id && 
         isSameDay(new Date(a.date), new Date(data.date!)) && 
         a.time === data.time && 
         a.status !== 'cancelled'
       );
       if(conflict) {
         return Promise.reject(new Error("Horário já preenchido!"));
       }
    }

    const a: Appointment = {
      ...data,
      id: generateId(),
      business_id: data.business_id!,
      client_id: generateId(),
      service_id: data.service_id!,
      date: data.date!,
      time: data.time!,
      duration: data.duration || (srv ? srv.duration : 30),
      price: data.price || (srv ? srv.price : 0),
      status: 'confirmed',
      service_name: srv ? srv.name : undefined,
      professional_name: prof ? prof.name : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    db.appointments.unshift(a);
    saveDB(db);
    return mockResponse(a);
  },
  
  list: async (params?: { business_id?: string; client_id?: string; date?: string; }) => {
    const db = getDB();
    let apts = db.appointments;
    if(params?.business_id) apts = apts.filter(a => a.business_id === params.business_id);
    // Order by date descendant
    apts.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return mockResponse({ appointments: apts });
  },
  
  getById: async (id: string) => mockResponse(getDB().appointments.find(a => a.id === id)),
  
  update: async (id: string, data: Partial<Appointment>) => {
    const db = getDB();
    const idx = db.appointments.findIndex(a => a.id === id);
    if(idx !== -1) {
      db.appointments[idx] = { ...db.appointments[idx], ...data, updated_at: new Date().toISOString() };
      saveDB(db);
    }
    return mockResponse(db.appointments[idx]);
  },
  
  cancel: async (id: string) => {
    const db = getDB();
    const idx = db.appointments.findIndex(a => a.id === id);
    if(idx !== -1) {
      db.appointments[idx].status = 'cancelled';
      saveDB(db);
    }
    return mockResponse({ success: true });
  },
  
  confirm: async (id: string) => {
    const db = getDB();
    const idx = db.appointments.findIndex(a => a.id === id);
    if(idx !== -1) {
      db.appointments[idx].status = 'confirmed';
      saveDB(db);
    }
    return mockResponse({ success: true });
  },
  
  complete: async (id: string) => {
    const db = getDB();
    const idx = db.appointments.findIndex(a => a.id === id);
    if(idx !== -1) {
      db.appointments[idx].status = 'completed';
      saveDB(db);
    }
    return mockResponse({ success: true });
  },
  
  stats: async (businessId: string) => {
    const db = getDB();
    const apts = db.appointments.filter(a => a.business_id === businessId && a.status !== 'cancelled');
    
    const dailyStats: Record<string, {date: string, revenue: number, count: number}> = {};
    const serviceStats: Record<string, {name: string, count: number}> = {};
    let totalRev = 0;
    
    apts.forEach(a => {
      const d = format(new Date(a.date), 'dd/MM');
      if(!dailyStats[d]) dailyStats[d] = { date: d, revenue: 0, count: 0 };
      dailyStats[d].revenue += a.price;
      dailyStats[d].count += 1;
      totalRev += a.price;
      
      const sName = a.service_name || 'Desconhecido';
      if(!serviceStats[sName]) serviceStats[sName] = { name: sName, count: 0 };
      serviceStats[sName].count += 1;
    });

    return mockResponse({
      totalAppointments: apts.length,
      revenue: totalRev,
      uniqueClients: new Set(apts.map(a => a.client_id)).size,
      dailyStats: Object.values(dailyStats),
      serviceStats: Object.values(serviceStats).sort((a,b) => b.count - a.count)
    });
  },
};

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'client' | 'professional';
  avatar?: string;
  created_at: string;
}

export interface Business {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  owner_id: string;
  working_hours?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  services?: Service[];
  professionals?: Professional[];
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  color: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Professional {
  id: string;
  user_id: string;
  business_id: string;
  bio?: string;
  specialty?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  services?: Service[];
  availability?: Availability[];
}

export interface Availability {
  id: string;
  professional_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  active: boolean;
}

export interface Appointment {
  id: string;
  business_id: string;
  client_id: string;
  professional_id?: string;
  service_id: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  service_name?: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  professional_name?: string;
}

const api = {};
export default api;
