// Mock API service for demo
const mockDB = {
  users: [{ email: 'demo@clinicavoice.ca', password: 'demo123', name: 'Dr. Demo' }],
  stats: { activePatients: 128, recentTranscriptions: 24, pendingReviews: 7 },
  transcriptions: [
    { id: 1, patient: 'John Doe', date: '2025-09-30', status: 'Reviewed' },
    { id: 2, patient: 'Jane Roe', date: '2025-09-29', status: 'Pending' }
  ]
}

export async function loginUser(email, password) {
  await new Promise(r => setTimeout(r, 400));
  const user = mockDB.users.find(u => u.email === email && u.password === password);
  if (!user) throw new Error('Invalid credentials');
  sessionStorage.setItem('clinica_token', 'mock-token');
  sessionStorage.setItem('clinica_user', JSON.stringify(user));
  return user;
}

export async function registerUser(name, email, password) {
  await new Promise(r => setTimeout(r, 600));
  const exists = mockDB.users.find(u => u.email === email);
  if (exists) throw new Error('Email already registered');
  const newUser = { name, email, password };
  mockDB.users.push(newUser);
  sessionStorage.setItem('clinica_token', 'mock-token');
  sessionStorage.setItem('clinica_user', JSON.stringify(newUser));
  return newUser;
}

export async function getDashboardStats() {
  await new Promise(r => setTimeout(r, 300));
  return mockDB.stats;
}

export async function getTranscriptions() {
  await new Promise(r => setTimeout(r, 300));
  return mockDB.transcriptions;
}
