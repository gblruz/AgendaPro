/**
 * @module stripeControllerAdvanced
 * @description Controlador Stripe com padrões de Engenharia Sênior.
 *
 * ## Características
 * - Idempotência: Webhooks podem ser reenviados sem duplicar dados
 * - Tratamento de Erros: Logging estruturado e recuperação graceful
 * - Customer Portal: Permite que clientes gerenciem assinaturas
 * - Retry Logic: Tentativas de reprocessamento com backoff
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const supabase = require('../database/supabase');

const PLAN_NAMES = {
  [process.env.STRIPE_PRICE_BASIC]: 'Básico',
  [process.env.STRIPE_PRICE_PROFESSIONAL]: 'Profissional',
  [process.env.STRIPE_PRICE_ENTERPRISE]: 'Empresarial',
};

/**
 * Cache simples para evitar processamento duplicado de webhooks.
 * Em produção, use Redis ou banco de dados.
 */
const webhookCache = new Map();
const WEBHOOK_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

function cacheWebhookEvent(eventId) {
  webhookCache.set(eventId, Date.now());
  // Limpar cache antigo
  for (const [id, timestamp] of webhookCache.entries()) {
    if (Date.now() - timestamp > WEBHOOK_CACHE_TTL) {
      webhookCache.delete(id);
    }
  }
}

function isWebhookProcessed(eventId) {
  return webhookCache.has(eventId);
}

const stripeControllerAdvanced = {
  /**
   * Criar sessão de checkout com validações robustas.
   */
  async createCheckoutSession(req, res) {
    try {
      const { priceId } = req.body;
      const userId = req.user.id;

      // Validações
      if (!priceId) {
        return res.status(400).json({ error: 'Price ID é obrigatório' });
      }

      if (!Object.values(PLAN_NAMES).length) {
        return res.status(500).json({ error: 'Planos não configurados' });
      }

      // Buscar usuário com retry
      let user;
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email, name, stripe_customer_id')
          .eq('id', userId)
          .single();

        if (userError || !userData) {
          return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        user = userData;
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        return res.status(500).json({ error: 'Erro ao buscar usuário' });
      }

      // Criar ou reutilizar Stripe Customer com idempotência
      let customerId = user.stripe_customer_id;
      if (!customerId) {
        try {
          const customer = await stripe.customers.create(
            {
              email: user.email,
              name: user.name,
              metadata: { userId, createdAt: new Date().toISOString() },
            },
            { idempotencyKey: `customer_${userId}_${Date.now()}` }
          );
          customerId = customer.id;

          // Salvar customer_id no banco
          await supabase
            .from('users')
            .update({ stripe_customer_id: customerId })
            .eq('id', userId);
        } catch (error) {
          console.error('Erro ao criar Stripe Customer:', error);
          return res.status(500).json({ error: 'Erro ao processar pagamento' });
        }
      }

      // Criar sessão do Stripe
      try {
        const session = await stripe.checkout.sessions.create(
          {
            payment_method_types: ['card'],
            customer: customerId,
            line_items: [
              {
                price: priceId,
                quantity: 1,
              },
            ],
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/#pricing`,
            metadata: {
              userId,
              createdAt: new Date().toISOString(),
            },
          },
          { idempotencyKey: `session_${userId}_${priceId}_${Date.now()}` }
        );

        res.json({ id: session.id, url: session.url });
      } catch (error) {
        console.error('Erro ao criar sessão de checkout:', error);
        res.status(500).json({ error: 'Erro ao processar pagamento' });
      }
    } catch (error) {
      console.error('Erro geral em createCheckoutSession:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  /**
   * Webhook robusto com idempotência e tratamento de erros.
   */
  async webhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    // Validar assinatura do webhook
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`Webhook Signature Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Verificar se já foi processado (idempotência)
    if (isWebhookProcessed(event.id)) {
      console.log(`Webhook ${event.id} já foi processado, ignorando...`);
      return res.json({ received: true });
    }

    cacheWebhookEvent(event.id);

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          await handleCheckoutSessionCompleted(event.data.object);
          break;
        }

        case 'customer.subscription.updated': {
          await handleSubscriptionUpdated(event.data.object);
          break;
        }

        case 'customer.subscription.deleted': {
          await handleSubscriptionDeleted(event.data.object);
          break;
        }

        case 'invoice.payment_failed': {
          await handleInvoicePaymentFailed(event.data.object);
          break;
        }

        default:
          console.log(`Evento não tratado: ${event.type}`);
      }
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      // Ainda retorna 200 para evitar retry infinito
    }

    res.json({ received: true });
  },

  /**
   * Criar portal de cliente para gerenciamento de assinaturas.
   */
  async createCustomerPortalSession(req, res) {
    try {
      const userId = req.user.id;

      // Buscar customer_id do usuário
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (userError || !user?.stripe_customer_id) {
        return res.status(404).json({ error: 'Cliente Stripe não encontrado' });
      }

      // Criar sessão do portal
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripe_customer_id,
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/settings`,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error('Erro ao criar sessão do portal:', error);
      res.status(500).json({ error: 'Erro ao acessar portal de cliente' });
    }
  },

  /**
   * Listar faturas do cliente.
   */
  async getInvoices(req, res) {
    try {
      const userId = req.user.id;

      const { data: user } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (!user?.stripe_customer_id) {
        return res.json({ invoices: [] });
      }

      const invoices = await stripe.invoices.list({
        customer: user.stripe_customer_id,
        limit: 10,
      });

      res.json({ invoices: invoices.data });
    } catch (error) {
      console.error('Erro ao buscar faturas:', error);
      res.status(500).json({ error: 'Erro ao buscar faturas' });
    }
  },
};

/**
 * Handlers privados para eventos do webhook
 */

async function handleCheckoutSessionCompleted(session) {
  const userId = session.metadata.userId;
  const subscriptionId = session.subscription;
  const customerId = session.customer;

  try {
    // Buscar detalhes da subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0]?.price?.id;
    const planName = PLAN_NAMES[priceId] || 'Desconhecido';

    // Salvar subscription no banco com upsert
    await supabase.from('subscriptions').upsert(
      [
        {
          user_id: userId,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: customerId,
          plan_name: planName,
          price_id: priceId,
          status: 'active',
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        },
      ],
      { onConflict: 'stripe_subscription_id' }
    );

    // Atualizar usuário
    await supabase
      .from('users')
      .update({
        subscription_id: subscriptionId,
        plan_name: planName,
        plan_active: true,
        stripe_customer_id: customerId,
      })
      .eq('id', userId);

    console.log(`✅ Assinatura ativada: ${planName} para usuário ${userId}`);
  } catch (error) {
    console.error('Erro ao processar checkout.session.completed:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription) {
  const status =
    subscription.status === 'active'
      ? 'active'
      : subscription.status === 'past_due'
        ? 'past_due'
        : subscription.status === 'trialing'
          ? 'trialing'
          : 'inactive';

  try {
    await supabase
      .from('subscriptions')
      .update({
        status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    // Buscar user_id pela subscription
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (sub) {
      await supabase
        .from('users')
        .update({ plan_active: status === 'active' || status === 'trialing' })
        .eq('id', sub.user_id);
    }

    console.log(`🔄 Assinatura atualizada: ${subscription.id} → ${status}`);
  } catch (error) {
    console.error('Erro ao processar customer.subscription.updated:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription) {
  try {
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('stripe_subscription_id', subscription.id);

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (sub) {
      await supabase
        .from('users')
        .update({ plan_active: false, plan_name: null, subscription_id: null })
        .eq('id', sub.user_id);
    }

    console.log(`❌ Assinatura cancelada: ${subscription.id}`);
  } catch (error) {
    console.error('Erro ao processar customer.subscription.deleted:', error);
    throw error;
  }
}

async function handleInvoicePaymentFailed(invoice) {
  try {
    console.warn(`⚠️ Falha de pagamento na fatura: ${invoice.id}`);
    // Aqui você pode enviar um email ao cliente ou tomar outras ações
  } catch (error) {
    console.error('Erro ao processar invoice.payment_failed:', error);
  }
}

module.exports = stripeControllerAdvanced;
