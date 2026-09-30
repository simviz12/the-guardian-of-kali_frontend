import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';

export const SettingsView: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    apiClient.getApiKeyStatus().then(res => {
      if (res.success) {
        setHasKey(res.data.has_key);
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await apiClient.updateApiKey(apiKey.trim());
      if (res.success) {
        setMessage({ text: 'API Key configurada y guardada correctamente.', type: 'success' });
        setHasKey(true);
        setApiKey(''); // Clear the input field for security
      } else {
        setMessage({ text: 'Error al guardar la API Key: ' + res.error?.message, type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: 'Error al conectar con el servidor.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-space-lg flex flex-col gap-space-lg text-on-surface h-full">
      <div className="bg-surface-container-low p-space-md flex flex-col md:flex-row md:items-center justify-between gap-space-md rounded-lg border border-outline-variant">
        <div className="flex items-center gap-space-md">
          <div className="w-9 h-9 bg-surface-container-high flex items-center justify-center text-primary rounded">
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </div>
          <div className="flex flex-col">
            <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight uppercase">SYSTEM SETTINGS</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
              Configure system parameters and external integrations.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-low p-space-lg rounded-lg border border-outline-variant flex-1">
        <h2 className="font-headline-sm text-headline-sm uppercase border-b border-outline-variant pb-2 mb-4 text-tertiary">
          AI Copilot Configuration
        </h2>
        
        <form onSubmit={handleSave} className="max-w-xl flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-medium">Google Gemini API Key</label>
            <p className="text-body-sm text-on-surface-variant mb-2">
              The Guardian of Kaliche utilizes Google Gemini 2.5 Flash for rapid intelligence gathering and command generation. 
              {hasKey ? (
                <span className="text-primary font-bold ml-2">"S API Key ya configurada.</span>
              ) : (
                <span className="text-error font-bold ml-2">~ API Key no encontrada.</span>
              )}
            </p>
            <input 
              type="password"
              required={!hasKey}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Reemplazar API Key actual..."
              className="w-full bg-surface-container border border-outline-variant rounded p-3 text-on-surface focus:outline-none focus:border-primary transition-colors font-mono"
            />
          </div>

          {message && (
            <div className={`p-3 rounded text-sm ${message.type === 'success' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-error/20 text-error border border-error/30'}`}>
              {message.text}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSaving || !apiKey.trim()}
            className="w-full sm:w-auto mt-2 bg-primary hover:bg-surface-tint text-on-primary font-headline-sm text-headline-sm uppercase tracking-wider py-2.5 px-6 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {isSaving ? 'Guardando...' : 'Actualizar API Key'}
          </button>
        </form>
      </div>
    </div>
  );
};
