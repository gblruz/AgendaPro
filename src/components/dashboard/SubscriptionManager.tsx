/**
 * @component SubscriptionManager
 * @description Componente para exibir e gerenciar assinatura Stripe.
 *
 * Funcionalidades:
 * - Exibir plano atual e data de renovação
 * - Botão para abrir Customer Portal
 * - Listar faturas recentes
 * - Status visual da assinatura
 */

import { useState } from 'react';
import { CreditCard, Calendar, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { formatDate } from '@/lib/formatters';

export function SubscriptionManager() {
  const { subscription, invoices, isLoading, error, openPortal } = useSubscription();
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const handleOpenPortal = async () => {
    setIsPortalLoading(true);
    try {
      await openPortal();
    } finally {
      setIsPortalLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-400">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900">Sem Assinatura Ativa</h3>
            <p className="text-gray-600 text-sm mt-1">
              Você não possui uma assinatura ativa. Escolha um plano para começar a usar todos os recursos.
            </p>
            <a
              href="/#pricing"
              className="inline-block mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Ver Planos
            </a>
          </div>
        </div>
      </div>
    );
  }

  const statusColors = {
    active: 'bg-green-50 border-green-200 text-green-900',
    trialing: 'bg-blue-50 border-blue-200 text-blue-900',
    past_due: 'bg-red-50 border-red-200 text-red-900',
    cancelled: 'bg-gray-50 border-gray-200 text-gray-900',
    inactive: 'bg-gray-50 border-gray-200 text-gray-900',
  };

  const statusIcons = {
    active: <CheckCircle className="w-5 h-5 text-green-600" />,
    trialing: <Calendar className="w-5 h-5 text-blue-600" />,
    past_due: <AlertCircle className="w-5 h-5 text-red-600" />,
    cancelled: <AlertCircle className="w-5 h-5 text-gray-600" />,
    inactive: <AlertCircle className="w-5 h-5 text-gray-600" />,
  };

  const statusLabels = {
    active: 'Ativo',
    trialing: 'Período de Teste',
    past_due: 'Pagamento Pendente',
    cancelled: 'Cancelado',
    inactive: 'Inativo',
  };

  const currentPeriodEnd = new Date(subscription.current_period_end);
  const daysUntilRenewal = Math.ceil(
    (currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6">
      {/* Card Principal de Assinatura */}
      <div
        className={`rounded-lg shadow p-6 border border-gray-200 ${statusColors[subscription.status]}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">{statusIcons[subscription.status]}</div>
            <div>
              <h3 className="font-semibold text-lg">Plano {subscription.plan_name}</h3>
              <p className="text-sm opacity-75 mt-1">{statusLabels[subscription.status]}</p>
            </div>
          </div>
          <button
            onClick={handleOpenPortal}
            disabled={isPortalLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isPortalLoading ? 'Carregando...' : 'Gerenciar'}
          </button>
        </div>

        {/* Informações de Renovação */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-white bg-opacity-50 rounded p-4">
            <p className="text-sm opacity-75">Próxima Renovação</p>
            <p className="font-semibold mt-1">{formatDate(subscription.current_period_end)}</p>
            {subscription.status === 'active' && (
              <p className="text-xs opacity-75 mt-2">Em {daysUntilRenewal} dias</p>
            )}
          </div>
          <div className="bg-white bg-opacity-50 rounded p-4">
            <p className="text-sm opacity-75">Período Atual</p>
            <p className="font-semibold mt-1">
              {formatDate(subscription.current_period_start)} até{' '}
              {formatDate(subscription.current_period_end)}
            </p>
          </div>
        </div>
      </div>

      {/* Mensagem de Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-900 text-sm">{error}</p>
        </div>
      )}

      {/* Faturas Recentes */}
      {invoices.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Faturas Recentes
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Data</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Número</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Valor</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(new Date(invoice.created * 1000))}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{invoice.number}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {(invoice.amount_paid / 100).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: invoice.currency.toUpperCase(),
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.paid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {invoice.paid ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <a
                        href={invoice.hosted_invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700"
                      >
                        <Download className="w-4 h-4" />
                        Ver
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Informações Adicionais */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          💡 <strong>Dica:</strong> Clique em "Gerenciar" para acessar o portal do cliente Stripe,
          onde você pode atualizar seu método de pagamento, gerenciar faturas e cancelar sua
          assinatura.
        </p>
      </div>
    </div>
  );
}
