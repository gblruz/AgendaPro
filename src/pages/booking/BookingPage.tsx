import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { businessAPI, serviceAPI, professionalAPI, appointmentAPI, type Business, type Service, type Professional } from '@/services/api';
import { ServiceSelection } from '@/components/booking/ServiceSelection';
import { DateTimeSelection } from '@/components/booking/DateTimeSelection';
import { ClientInfo } from '@/components/booking/ClientInfo';
import { BookingConfirmation } from '@/components/booking/BookingConfirmation';
import { BookingSuccess } from '@/components/booking/BookingSuccess';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';

export function BookingPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Booking state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientData, setClientData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    if (businessId) {
      loadBusinessData();
    }
  }, [businessId]);

  const loadBusinessData = async () => {
    try {
      setIsLoading(true);
      const [bizRes, servRes, profRes] = await Promise.all([
        businessAPI.getById(businessId!),
        serviceAPI.list(businessId),
        professionalAPI.list(businessId),
      ]);

      setBusiness(bizRes.data.business || null);
      setServices(servRes.data.services);
      setProfessionals(profRes.data.professionals);
    } catch (error) {
      toast.error('Erro ao carregar informações do negócio');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleDateTimeSelect = (date: Date, time: string, professional: Professional | null) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setSelectedProfessional(professional);
    setStep(3);
  };

  const handleClientInfoSubmit = (data: typeof clientData) => {
    setClientData(data);
    setStep(4);
  };

  const handleConfirmBooking = async () => {
    try {
      setIsLoading(true);
      await appointmentAPI.create({
        business_id: businessId,
        service_id: selectedService?.id,
        professional_id: selectedProfessional?.id,
        date: selectedDate?.toISOString().split('T')[0],
        time: selectedTime,
        client_name: clientData.name,
        client_email: clientData.email,
        client_phone: clientData.phone,
        notes: clientData.notes,
      });
      setStep(5);
    } catch (error) {
      toast.error('Erro ao realizar agendamento. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && step === 1) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin" />
      </div>
    );
  }

  const themeStyle = business?.theme_color ? (
    <style dangerouslySetInnerHTML={{ __html: `
      .booking-theme-wrapper {
        --theme-color: ${business.theme_color};
      }
      .booking-theme-wrapper .text-\\[\\#7C3AED\\] { color: var(--theme-color) !important; }
      .booking-theme-wrapper .group:hover .group-hover\\:text-\\[\\#7C3AED\\] { color: var(--theme-color) !important; }
      .booking-theme-wrapper .bg-\\[\\#7C3AED\\] { background-color: var(--theme-color) !important; }
      .booking-theme-wrapper .border-\\[\\#7C3AED\\] { border-color: var(--theme-color) !important; }
      .booking-theme-wrapper .hover\\:border-\\[\\#7C3AED\\]\\/50:hover { border-color: color-mix(in srgb, var(--theme-color) 50%, transparent) !important; }
      .booking-theme-wrapper .border-\\[\\#7C3AED\\]\\/30 { border-color: color-mix(in srgb, var(--theme-color) 30%, transparent) !important; }
      .booking-theme-wrapper .border-t-\\[\\#7C3AED\\] { border-top-color: var(--theme-color) !important; }
      .booking-theme-wrapper .hover\\:bg-\\[\\#7C3AED\\]\\/5:hover { background-color: color-mix(in srgb, var(--theme-color) 5%, transparent) !important; }
      .booking-theme-wrapper .bg-\\[\\#7C3AED\\]\\/10 { background-color: color-mix(in srgb, var(--theme-color) 10%, transparent) !important; }
      .booking-theme-wrapper .bg-\\[\\#7C3AED\\]\\/20 { background-color: color-mix(in srgb, var(--theme-color) 20%, transparent) !important; }
      
      .booking-theme-wrapper .btn-primary {
         background: var(--theme-color) !important;
         box-shadow: none !important;
      }
      .booking-theme-wrapper .btn-primary:hover {
         box-shadow: 0 10px 15px -3px color-mix(in srgb, var(--theme-color) 25%, transparent) !important;
      }
    `}} />
  ) : null;

  return (
    <div className="min-h-screen bg-[#0F0F0F] py-12 px-4 booking-theme-wrapper">
      {themeStyle}
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={() => navigate('/')} 
            className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar para o início
          </button>
        </div>
        
        <div className="text-center mb-12">
          {business?.logo ? (
            <img src={business.logo} alt={business.name} className="w-20 h-20 rounded-2xl mx-auto mb-4 object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-[#7C3AED]/20 flex items-center justify-center mx-auto mb-4 border border-[#7C3AED]/30">
              <span className="text-[#7C3AED] text-3xl font-bold">{business?.name?.[0]}</span>
            </div>
          )}
          <h1 className="text-3xl font-bold text-white mb-2">{business?.name}</h1>
          <p className="text-gray-400">{business?.description}</p>
        </div>

        {/* Steps */}
        <div className="bg-[#1A1A1A] rounded-3xl border border-white/5 p-6 lg:p-8 shadow-2xl">
          {step === 1 && (
            <ServiceSelection 
              services={services} 
              onSelect={handleServiceSelect} 
            />
          )}
          {step === 2 && (
            <DateTimeSelection 
              businessId={businessId!}
              service={selectedService!}
              professionals={professionals}
              onSelect={handleDateTimeSelect}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <ClientInfo 
              onSubmit={handleClientInfoSubmit}
              onBack={() => setStep(2)}
              initialData={clientData}
            />
          )}
          {step === 4 && (
            <BookingConfirmation 
              business={business!}
              service={selectedService!}
              professional={selectedProfessional}
              date={selectedDate!}
              time={selectedTime}
              clientData={clientData}
              onConfirm={handleConfirmBooking}
              onBack={() => setStep(3)}
              isLoading={isLoading}
            />
          )}
          {step === 5 && (
            <BookingSuccess 
              business={business!}
              date={selectedDate!}
              time={selectedTime}
            />
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Powered by <span className="text-white font-semibold">AgendaPro</span>
          </p>
        </div>
      </div>
    </div>
  );
}
