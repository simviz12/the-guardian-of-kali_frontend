import React, { useState, useEffect } from 'react';
import { apiClient, CommandHistoryItem } from '../../services/apiClient';

export const SessionHistory: React.FC = () => {
  const [commands, setCommands] = useState<CommandHistoryItem[]>([]);
  
  useEffect(() => {
    const fetchHistory = async () => {
      const result = await apiClient.getHistory({});
      if (result.success && result.data.commands) {
        setCommands(result.data.commands);
      }
    };
    fetchHistory();
  }, []);

  const aiCommands = commands.filter(c => c.origin === 'AI').length;
  const blockedCommands = commands.filter(c => c.risk_level === 'BLOCKED' || c.policy_decision === 'BLOCKED').length;

  return (
    <div className="p-space-lg flex flex-col gap-space-lg text-on-surface h-full">
      <div className="bg-surface-container-low p-space-md flex flex-col md:flex-row md:items-center justify-between gap-space-md rounded-lg border border-outline-variant">
        <div className="flex items-center gap-space-md">
          <div className="w-9 h-9 bg-surface-container-high flex items-center justify-center text-primary rounded">
            <span className="material-symbols-outlined text-[20px]">shield_lock</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-space-sm">
              <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight uppercase">HISTORIAL DE AUDITORÍA GLOBAL</h1>
              <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-surface-container-high text-primary uppercase rounded">v1.4 SEC-LOG</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
              <span>Registro de operaciones inmutable</span>
              <span className="text-outline-variant">•</span>
              <span className="font-label-sm text-label-sm text-primary">SIG: VALID</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-space-xs font-label-md text-label-md">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-2 text-[14px] text-on-surface-variant pointer-events-none">search</span>
            <input 
              type="text" 
              placeholder="Buscar registros..." 
              className="bg-surface-container-lowest text-on-surface pl-6 pr-2.5 py-1 font-label-sm text-label-sm outline-none placeholder:text-outline focus:bg-surface-container-high w-36 lg:w-48 transition-all rounded" 
            />
          </div>
          <button className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm flex items-center gap-1 transition-colors rounded">
            <span className="material-symbols-outlined text-[13px] text-primary">download</span>
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <div className="bg-surface-container-low p-space-md flex flex-col justify-between relative overflow-hidden rounded-lg border border-outline-variant">
          <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
            <span className="uppercase tracking-wider">OPERACIONES TOTALES</span>
            <span className="material-symbols-outlined text-[15px] text-outline">database</span>
          </div>
          <div className="flex items-baseline justify-between mt-space-md">
            <span className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">{commands.length}</span>
          </div>
          <div className="w-full bg-surface-container-lowest h-1 mt-space-sm rounded-full"><div className="bg-outline h-1 w-full rounded-full"></div></div>
        </div>

        <div className="bg-surface-container-low p-space-md flex flex-col justify-between relative overflow-hidden rounded-lg border border-outline-variant">
          <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
            <span className="uppercase tracking-wider">ACCIONES DE LA IA</span>
            <span className="material-symbols-outlined text-[15px] text-tertiary">smart_toy</span>
          </div>
          <div className="flex items-baseline justify-between mt-space-md">
            <span className="font-headline-lg text-headline-lg font-bold text-tertiary tracking-tight">{aiCommands}</span>
          </div>
          <div className="w-full bg-surface-container-lowest h-1 mt-space-sm rounded-full"><div className="bg-tertiary h-1 w-1/3 rounded-full"></div></div>
        </div>

        <div className="bg-surface-container-low p-space-md flex flex-col justify-between relative overflow-hidden rounded-lg border border-outline-variant">
          <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
            <span className="uppercase tracking-wider text-error">INTERCEPCIONES BLOQUEADAS</span>
            <span className="material-symbols-outlined text-[15px] text-error">gpp_bad</span>
          </div>
          <div className="flex items-baseline justify-between mt-space-md">
            <span className="font-headline-lg text-headline-lg font-bold text-error tracking-tight">{blockedCommands}</span>
            <span className="font-label-sm text-label-sm text-error uppercase">INTERCEPCIÓN ESTRICTA</span>
          </div>
          <div className="w-full bg-surface-container-lowest h-1 mt-space-sm rounded-full"><div className="bg-error h-1 w-1/4 rounded-full"></div></div>
        </div>

        <div className="bg-surface-container-low p-space-md flex flex-col justify-between relative overflow-hidden rounded-lg border border-outline-variant">
          <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
            <span className="uppercase tracking-wider">ESTADO DE LA SESIÓN</span>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          </div>
          <div className="flex items-baseline justify-between mt-space-md">
            <span className="font-headline-lg text-headline-lg font-bold text-primary tracking-tight">ACTIVA</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">PROTEGIDA</span>
          </div>
          <div className="w-full bg-surface-container-lowest h-1 mt-space-sm rounded-full"><div className="bg-primary h-1 w-[82%] rounded-full"></div></div>
        </div>
      </div>

      <div className="bg-surface-container-low flex flex-col rounded-lg border border-outline-variant flex-1 overflow-hidden">
        <div className="px-space-md py-space-sm bg-surface-container flex items-center justify-between border-b border-outline-variant">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-[15px] text-primary">data_table</span>
            <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-semibold">REGISTRO DE TELEMETRÍA VERIFICADO [FLUJO DE AUDITORÍA ZERO-TRUST]</span>
          </div>
        </div>
        <div className="overflow-y-auto w-full flex-1">
          <table className="w-full text-left font-label-sm text-label-sm border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-surface-container-high text-on-surface-variant uppercase text-[11px] select-none">
                <th className="py-2 px-3 font-medium">HORA</th>
                <th className="py-2 px-3 font-medium">OPERADOR</th>
                <th className="py-2 px-3 font-medium">ORIGEN</th>
                <th className="py-2 px-3 font-medium min-w-[320px]">COMANDO</th>
                <th className="py-2 px-3 font-medium text-center">RIESGO</th>
                <th className="py-2 px-3 font-medium text-right">ESTADO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest font-mono">
              {commands.map((cmd, index) => (
                <tr key={index} className="bg-surface-container-low hover:bg-surface-container transition-colors">
                  <td className="py-2 px-3 text-on-surface-variant">{new Date(cmd.timestamp).toLocaleTimeString()}</td>
                  <td className="py-2 px-3 text-on-surface">carlos</td>
                  <td className="py-2 px-3">
                    <span className={`px-1.5 py-0.5 text-[10px] rounded ${cmd.origin === 'USER' ? 'bg-surface-container-highest text-on-surface' : 'bg-secondary-container text-on-secondary-container'}`}>
                      {cmd.origin}
                    </span>
                  </td>
                  <td className={`py-2 px-3 font-semibold select-all ${cmd.policy_decision === 'BLOCKED' ? 'text-error line-through' : (cmd.origin === 'USER' ? 'text-primary' : 'text-tertiary')}`}>
                    {cmd.text}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className={`px-2 py-0.5 uppercase text-[10px] font-bold rounded ${cmd.risk_level === 'HIGH' || cmd.risk_level === 'BLOCKED' || cmd.policy_decision === 'BLOCKED' ? 'bg-error-container text-on-error-container' : 'bg-surface-container-high text-primary'}`}>
                      {cmd.risk_level || 'LOW'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <span className={`px-2 py-0.5 uppercase text-[10px] font-bold inline-flex items-center gap-1 rounded ${cmd.policy_decision === 'BLOCKED' ? 'bg-error-container text-error' : 'bg-surface-container-high text-primary'}`}>
                      <span className="material-symbols-outlined text-[10px]">{cmd.policy_decision === 'BLOCKED' ? 'block' : 'check'}</span> 
                      {cmd.policy_decision === 'BLOCKED' ? 'BLOCKED' : 'EXECUTED'}
                    </span>
                  </td>
                </tr>
              ))}
              {commands.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-outline-variant italic">No hay operaciones registradas en el libro mayor.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
