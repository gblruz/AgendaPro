const supabase = require('../database/supabase');

const serviceController = {
  // Criar serviço
  async create(req, res) {
    try {
      const { business_id, name, description, duration, price, color } = req.body;

      if (!business_id || !name || !duration || !price) {
        return res.status(400).json({ error: 'Dados incompletos' });
      }

      const { data: service, error } = await supabase
        .from('services')
        .insert([{ 
          business_id, 
          name, 
          description, 
          duration, 
          price, 
          color: color || '#7C3AED' 
        }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        message: 'Serviço criado com sucesso',
        service
      });
    } catch (error) {
      console.error('Erro ao criar serviço:', error);
      res.status(500).json({ error: 'Erro ao criar serviço' });
    }
  },

  // Listar serviços
  async list(req, res) {
    try {
      const { business_id } = req.query;

      let query = supabase.from('services').select('*').eq('active', true).order('name');
      
      if (business_id) {
        query = query.eq('business_id', business_id);
      }

      const { data: services, error } = await query;
      if (error) throw error;

      res.json({ services });
    } catch (error) {
      console.error('Erro ao listar serviços:', error);
      res.status(500).json({ error: 'Erro ao listar serviços' });
    }
  },

  // Obter serviço por ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      const { data: service, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .eq('active', true)
        .single();

      if (error || !service) {
        return res.status(404).json({ error: 'Serviço não encontrado' });
      }

      res.json({ service });
    } catch (error) {
      console.error('Erro ao buscar serviço:', error);
      res.status(500).json({ error: 'Erro ao buscar serviço' });
    }
  },

  // Atualizar serviço
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description, duration, price, color, active } = req.body;

      const { data: updatedService, error } = await supabase
        .from('services')
        .update({ 
          name, 
          description, 
          duration, 
          price, 
          color, 
          active, 
          updated_at: new Date() 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        message: 'Serviço atualizado com sucesso',
        service: updatedService
      });
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error);
      res.status(500).json({ error: 'Erro ao atualizar serviço' });
    }
  },

  // Deletar serviço
  async delete(req, res) {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('services')
        .update({ active: false, updated_at: new Date() })
        .eq('id', id);

      if (error) throw error;

      res.json({ message: 'Serviço removido com sucesso' });
    } catch (error) {
      console.error('Erro ao remover serviço:', error);
      res.status(500).json({ error: 'Erro ao remover serviço' });
    }
  }
};

module.exports = serviceController;
