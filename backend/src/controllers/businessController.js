const supabase = require('../database/supabase');

const businessController = {
  // Criar negócio
  async create(req, res) {
    try {
      const { name, description, address, phone, email, working_hours } = req.body;
      const ownerId = req.user.id;

      if (!name) {
        return res.status(400).json({ error: 'Nome do negócio é obrigatório' });
      }

      const { data: business, error } = await supabase
        .from('businesses')
        .insert([{ 
          name, 
          description, 
          address, 
          phone, 
          email, 
          owner_id: ownerId, 
          working_hours 
        }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        message: 'Negócio criado com sucesso',
        business
      });
    } catch (error) {
      console.error('Erro ao criar negócio:', error);
      res.status(500).json({ error: 'Erro ao criar negócio' });
    }
  },

  // Listar negócios do usuário
  async list(req, res) {
    try {
      const userId = req.user.id;
      const { role } = req.user;

      let query = supabase.from('businesses').select('*').eq('active', true);
      
      if (role !== 'admin') {
        query = query.eq('owner_id', userId);
      }

      const { data: businesses, error } = await query;
      if (error) throw error;

      res.json({ businesses });
    } catch (error) {
      console.error('Erro ao listar negócios:', error);
      res.status(500).json({ error: 'Erro ao listar negócios' });
    }
  },

  // Obter negócio por ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .eq('active', true)
        .single();

      if (businessError || !business) {
        return res.status(404).json({ error: 'Negócio não encontrado' });
      }

      // Buscar serviços do negócio
      const { data: services } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', id)
        .eq('active', true);

      // Buscar profissionais do negócio
      const { data: professionals } = await supabase
        .from('professionals')
        .select(`
          *,
          users (name, email, phone, avatar)
        `)
        .eq('business_id', id)
        .eq('active', true);

      res.json({ 
        business: {
          ...business,
          services,
          professionals
        }
      });
    } catch (error) {
      console.error('Erro ao buscar negócio:', error);
      res.status(500).json({ error: 'Erro ao buscar negócio' });
    }
  },

  // Atualizar negócio
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description, address, phone, email, working_hours, logo } = req.body;

      const { data: business, error: fetchError } = await supabase
        .from('businesses')
        .select('owner_id')
        .eq('id', id)
        .single();

      if (fetchError || !business) {
        return res.status(404).json({ error: 'Negócio não encontrado' });
      }

      // Verificar se é o dono
      if (business.owner_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { data: updatedBusiness, error: updateError } = await supabase
        .from('businesses')
        .update({ 
          name, 
          description, 
          address, 
          phone, 
          email, 
          working_hours, 
          logo, 
          updated_at: new Date() 
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      res.json({
        message: 'Negócio atualizado com sucesso',
        business: updatedBusiness
      });
    } catch (error) {
      console.error('Erro ao atualizar negócio:', error);
      res.status(500).json({ error: 'Erro ao atualizar negócio' });
    }
  },

  // Deletar negócio (soft delete)
  async delete(req, res) {
    try {
      const { id } = req.params;

      const { data: business, error: fetchError } = await supabase
        .from('businesses')
        .select('owner_id')
        .eq('id', id)
        .single();

      if (fetchError || !business) {
        return res.status(404).json({ error: 'Negócio não encontrado' });
      }

      if (business.owner_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { error: deleteError } = await supabase
        .from('businesses')
        .update({ active: false, updated_at: new Date() })
        .eq('id', id);

      if (deleteError) throw deleteError;

      res.json({ message: 'Negócio removido com sucesso' });
    } catch (error) {
      console.error('Erro ao remover negócio:', error);
      res.status(500).json({ error: 'Erro ao remover negócio' });
    }
  },

  // Dashboard do negócio
  async dashboard(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      const start = startDate || '1970-01-01';
      const end = endDate || '9999-12-31';

      // Total de agendamentos
      const { count: totalAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', id);

      // Agendamentos do período
      const { count: periodAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', id)
        .gte('date', start)
        .lte('date', end);

      // Faturamento do período
      const { data: revenueData } = await supabase
        .from('appointments')
        .select('price')
        .eq('business_id', id)
        .eq('status', 'completed')
        .gte('date', start)
        .lte('date', end);
      
      const revenue = revenueData?.reduce((sum, item) => sum + Number(item.price), 0) || 0;

      // Clientes únicos
      const { data: clientsData } = await supabase
        .from('appointments')
        .select('client_id')
        .eq('business_id', id);
      
      const uniqueClients = new Set(clientsData?.map(item => item.client_id)).size;

      // Agendamentos por status
      const { data: statusData } = await supabase
        .from('appointments')
        .select('status');
      
      const appointmentsByStatus = Object.entries(
        statusData?.reduce((acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {}) || {}
      ).map(([status, count]) => ({ status, count }));

      res.json({
        totalAppointments,
        periodAppointments,
        revenue,
        uniqueClients,
        appointmentsByStatus,
        appointmentsByDay: [] // Implementação simplificada
      });
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error);
      res.status(500).json({ error: 'Erro ao buscar dashboard' });
    }
  }
};

module.exports = businessController;
