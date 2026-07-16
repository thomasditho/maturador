import { SystemSettings, Instance, InstanceStatus } from '../types';

export const EvolutionService = {
  
  getHeaders: (settings: SystemSettings) => ({
    'Content-Type': 'application/json',
    'apikey': settings.evolutionApiKey?.trim()
  }),

  // Helper para garantir que a URL está limpa e segura
  getCleanUrl: (url: string) => {
    let clean = url.trim().replace(/\/$/, ''); // Remove barra final
    if (clean.startsWith('http://')) {
        clean = clean.replace('http://', 'https://');
    }
    return clean;
  },

  // Helpers para persistência local de números corrigidos manualmente
  getPhoneOverrides: (): Record<string, string> => {
    const saved = localStorage.getItem('ditho_phone_overrides');
    return saved ? JSON.parse(saved) : {};
  },

  savePhoneOverride: (instanceName: string, phoneNumber: string) => {
    const overrides = EvolutionService.getPhoneOverrides();
    overrides[instanceName] = phoneNumber;
    localStorage.setItem('ditho_phone_overrides', JSON.stringify(overrides));
  },

  // Fetch all instances from Evolution
  fetchInstances: async (settings: SystemSettings): Promise<Instance[]> => {
    if (!settings.evolutionApiUrl || !settings.evolutionApiKey) {
        console.warn("[Evolution] Configurações ausentes para fetchInstances");
        return [];
    }

    const baseUrl = EvolutionService.getCleanUrl(settings.evolutionApiUrl);

    try {
      const response = await fetch(`${baseUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: EvolutionService.getHeaders(settings),
        mode: 'cors',
        cache: 'no-cache'
      });
      
      if (!response.ok) {
          console.error(`[Evolution] Erro HTTP ${response.status} ao buscar instâncias`);
          return [];
      }

      const data = await response.json();
      const instancesRaw = Array.isArray(data) ? data : (data.instances || []);
      const overrides = EvolutionService.getPhoneOverrides();

      if (!Array.isArray(instancesRaw)) {
          console.error("Formato inesperado de instâncias:", data);
          return [];
      }

      return instancesRaw.map((inst: any) => {
        const actualInstance = inst.instance || inst;
        const name = actualInstance?.instanceName || actualInstance?.name || 'Desconhecido';
        
        let owner = overrides[name];
        
        if (!owner) {
            owner = actualInstance?.owner || actualInstance?.phoneNumber || actualInstance?.token;
            if (!owner && actualInstance?.id) {
                owner = actualInstance.id.split('@')[0];
            }
        }
        
        const statusRaw = (actualInstance?.status || actualInstance?.connectionStatus || '').toLowerCase();
        const isConnected = ['open', 'connected', 'connecting'].includes(statusRaw);

        return {
          id: name,
          name: name,
          phoneNumber: owner || 'Sem número',
          status: isConnected ? InstanceStatus.CONNECTED : InstanceStatus.DISCONNECTED,
          totalSent: 0,
          batteryLevel: 100
        };
      });
    } catch (error) {
      console.error("Error fetching instances:", error);
      return [];
    }
  },

  // Create a new instance
  createInstance: async (settings: SystemSettings, instanceName: string): Promise<any> => {
    const baseUrl = EvolutionService.getCleanUrl(settings.evolutionApiUrl);
    try {
      const response = await fetch(`${baseUrl}/instance/create`, {
        method: 'POST',
        headers: EvolutionService.getHeaders(settings),
        body: JSON.stringify({
          instanceName: instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data?.message || data?.response?.message || (data.error ? data.error : JSON.stringify(data));
        throw new Error(errorMessage || "Falha ao criar instância na API");
      }

      return data;
    } catch (error) {
      console.error("Error creating instance:", error);
      throw error;
    }
  },

  // Connect (Get QR Code)
  connectInstance: async (settings: SystemSettings, instanceName: string): Promise<string | null> => {
    const baseUrl = EvolutionService.getCleanUrl(settings.evolutionApiUrl);
    try {
      const response = await fetch(`${baseUrl}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: EvolutionService.getHeaders(settings)
      });
      const data = await response.json();
      
      if (!response.ok) {
          console.error("Connect error:", data);
          return null;
      }

      return data.base64 || data.qrcode || null;
    } catch (error) {
      console.error("Error getting QR:", error);
      return null;
    }
  },

  // Send Text Message
  sendText: async (settings: SystemSettings, instanceName: string, number: string, text: string): Promise<boolean> => {
    const baseUrl = EvolutionService.getCleanUrl(settings.evolutionApiUrl);
    try {
      let cleanNumber = number.replace(/\D/g, '');

      if (!cleanNumber.startsWith('55') && (cleanNumber.length === 10 || cleanNumber.length === 11)) {
          cleanNumber = '55' + cleanNumber;
      }
      
      const bodyPayload = {
        number: cleanNumber,
        options: {
          delay: 1200,
          presence: "composing",
          linkPreview: false
        },
        text: text,
        textMessage: {
          text: text
        }
      };

      const response = await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: EvolutionService.getHeaders(settings),
        body: JSON.stringify(bodyPayload)
      });

      if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Evolution] Erro no envio (${response.status}):`, errorText);
          return false;
      }

      return true;
    } catch (error) {
      console.error(`[Evolution] Erro de exceção ao enviar para ${number}:`, error);
      return false;
    }
  },

  // Send Media Message (Image)
  sendMedia: async (settings: SystemSettings, instanceName: string, number: string, mediaBase64: string, caption: string): Promise<boolean> => {
    const baseUrl = EvolutionService.getCleanUrl(settings.evolutionApiUrl);
    try {
        let cleanNumber = number.replace(/\D/g, '');
        if (!cleanNumber.startsWith('55') && (cleanNumber.length === 10 || cleanNumber.length === 11)) {
            cleanNumber = '55' + cleanNumber;
        }

        const cleanBase64 = mediaBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");

        const bodyPayload = {
            number: cleanNumber,
            options: {
                delay: 1200,
                presence: "composing"
            },
            mediatype: "image",
            caption: caption,
            media: cleanBase64 
        };

        const response = await fetch(`${baseUrl}/message/sendMedia/${instanceName}`, {
            method: 'POST',
            headers: EvolutionService.getHeaders(settings),
            body: JSON.stringify(bodyPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Evolution] Erro no envio de Mídia (${response.status}):`, errorText);
            return false;
        }

        return true;

    } catch (error) {
        console.error(`[Evolution] Erro de exceção ao enviar mídia para ${number}:`, error);
        return false;
    }
  },

  // Delete Instance
  deleteInstance: async (settings: SystemSettings, instanceName: string) => {
      const baseUrl = EvolutionService.getCleanUrl(settings.evolutionApiUrl);
      await fetch(`${baseUrl}/instance/delete/${instanceName}`, {
          method: 'DELETE',
          headers: EvolutionService.getHeaders(settings)
      });
  }
};