const { db } = require('./connection');

const initDatabase = async () => {
  try {
    // Tabela de usuários
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          phone TEXT,
          role TEXT DEFAULT 'client' CHECK(role IN ('admin', 'client', 'professional')),
          avatar TEXT,
          active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => err ? reject(err) : resolve());
    });

    // Tabela de negócios
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS businesses (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          address TEXT,
          phone TEXT,
          email TEXT,
          logo TEXT,
          owner_id TEXT NOT NULL,
          working_hours TEXT,
          active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (owner_id) REFERENCES users(id)
        )
      `, (err) => err ? reject(err) : resolve());
    });

    // Tabela de serviços
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS services (
          id TEXT PRIMARY KEY,
          business_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          duration INTEGER NOT NULL,
          price REAL NOT NULL,
          color TEXT DEFAULT '#7C3AED',
          active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (business_id) REFERENCES businesses(id)
        )
      `, (err) => err ? reject(err) : resolve());
    });

    // Tabela de profissionais
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS professionals (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          business_id TEXT NOT NULL,
          bio TEXT,
          specialty TEXT,
          active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (business_id) REFERENCES businesses(id)
        )
      `, (err) => err ? reject(err) : resolve());
    });

    // Tabela de relação profissionais-serviços
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS professional_services (
          professional_id TEXT NOT NULL,
          service_id TEXT NOT NULL,
          PRIMARY KEY (professional_id, service_id),
          FOREIGN KEY (professional_id) REFERENCES professionals(id),
          FOREIGN KEY (service_id) REFERENCES services(id)
        )
      `, (err) => err ? reject(err) : resolve());
    });

    // Tabela de agendamentos
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS appointments (
          id TEXT PRIMARY KEY,
          business_id TEXT NOT NULL,
          client_id TEXT NOT NULL,
          professional_id TEXT,
          service_id TEXT NOT NULL,
          date TEXT NOT NULL,
          time TEXT NOT NULL,
          duration INTEGER NOT NULL,
          price REAL NOT NULL,
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'completed', 'cancelled')),
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (business_id) REFERENCES businesses(id),
          FOREIGN KEY (client_id) REFERENCES users(id),
          FOREIGN KEY (professional_id) REFERENCES professionals(id),
          FOREIGN KEY (service_id) REFERENCES services(id)
        )
      `, (err) => err ? reject(err) : resolve());
    });

    // Tabela de horários disponíveis
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS availability (
          id TEXT PRIMARY KEY,
          professional_id TEXT NOT NULL,
          day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (professional_id) REFERENCES professionals(id)
        )
      `, (err) => err ? reject(err) : resolve());
    });

    // Tabela de bloqueios de horário
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS blocked_slots (
          id TEXT PRIMARY KEY,
          professional_id TEXT NOT NULL,
          date TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          reason TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (professional_id) REFERENCES professionals(id)
        )
      `, (err) => err ? reject(err) : resolve());
    });

    console.log('Banco de dados inicializado com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    process.exit(1);
  }
};

initDatabase();
