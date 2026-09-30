import React from 'react';

export const GuideView: React.FC = () => {
  return (
    <div className="p-space-lg flex flex-col gap-space-lg text-on-surface h-full">
      <div className="bg-surface-container-low p-space-md flex flex-col md:flex-row md:items-center justify-between gap-space-md rounded-lg border border-outline-variant">
        <div className="flex items-center gap-space-md">
          <div className="w-9 h-9 bg-surface-container-high flex items-center justify-center text-primary rounded">
            <span className="material-symbols-outlined text-[20px]">menu_book</span>
          </div>
          <div className="flex flex-col">
            <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight uppercase">GUÍA OPERATIVA ZERO-TRUST</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
              Documentación técnica y reglas de operación (RoE) del Copiloto IA.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-space-lg flex-1 overflow-hidden">
        
        {/* Left Column */}
        <div className="flex-1 flex flex-col gap-space-lg overflow-y-auto pr-2 custom-scrollbar">
          
          <div className="bg-surface-container-low p-space-lg rounded-lg border border-outline-variant">
            <h2 className="font-headline-sm text-headline-sm uppercase border-b border-outline-variant pb-2 mb-4 text-tertiary">
              Reglas de Operación (Rules of Engagement)
            </h2>
            <div className="space-y-4 font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              <p>
                <strong>The Guardian of Kaliche</strong> es un copiloto de seguridad ofensiva/defensiva 
                diseñado bajo una estricta arquitectura <em>Zero-Trust</em>. Todos los comandos propuestos por 
                la IA son evaluados por un motor de políticas de aislamiento antes de poder ejecutarse.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-on-surface">Restricción de Alcance (Scope):</strong> La IA solo propondrá y ejecutará comandos que apunten al alcance (Scope) autorizado al inicio de la sesión. </li>
                <li><strong className="text-on-surface">Validación de Puertos:</strong> Si configuraste puertos permitidos, cualquier intento de escanear o atacar puertos fuera de la lista será bloqueado de inmediato.</li>
                <li><strong className="text-error">Bloqueo de Destrucción:</strong> Comandos que pongan en riesgo la integridad del sistema (ej. <code className="bg-surface-container px-1 py-0.5 rounded">rm -rf /</code>, alteración de configuraciones locales) son rechazados.</li>
              </ul>
            </div>
          </div>

          <div className="bg-surface-container-low p-space-lg rounded-lg border border-outline-variant">
            <h2 className="font-headline-sm text-headline-sm uppercase border-b border-outline-variant pb-2 mb-4 text-primary">
              Módulo de Reconocimiento y Escaneo (Ejemplos Seguros)
            </h2>
            <div className="space-y-4 font-body-sm text-body-sm text-on-surface-variant">
              <p>Puedes solicitar a la IA que estructure comandos de red complejos. Estos son algunos ejemplos de lo que puedes pedirle al copiloto en el chat:</p>
              
              <div className="bg-surface-container p-3 rounded font-mono text-xs">
                <p className="text-tertiary mb-1"># Solicitar un escaneo pasivo o DNS:</p>
                <p className="text-on-surface">"Realiza una transferencia de zona DNS al dominio objetivo"</p>
                <p className="text-on-surface mt-2">"Usa theHarvester para recopilar correos del alcance autorizado"</p>
              </div>

              <div className="bg-surface-container p-3 rounded font-mono text-xs">
                <p className="text-tertiary mb-1"># Solicitar un escaneo activo de puertos (Nmap):</p>
                <p className="text-on-surface">"Haz un escaneo rápido de los top 100 puertos"</p>
                <p className="text-on-surface mt-2">"Ejecuta nmap con detección de versiones y SO en el objetivo"</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="flex-1 flex flex-col gap-space-lg overflow-y-auto pr-2 custom-scrollbar">
          
          <div className="bg-surface-container-low p-space-lg rounded-lg border border-outline-variant">
            <h2 className="font-headline-sm text-headline-sm uppercase border-b border-outline-variant pb-2 mb-4 text-error">
              Evaluación de Credenciales (Hydra & Crackers)
            </h2>
            <div className="space-y-4 font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              <p>
                El copiloto te asiste en la formulación de ataques de diccionario o fuerza bruta 
                (exclusivamente sobre tu objetivo autorizado). 
              </p>
              <div className="bg-error-container/10 border border-error/20 p-3 rounded text-error text-xs mb-3">
                <span className="material-symbols-outlined text-[14px] inline-block mr-1 align-middle">warning</span>
                Nota: Proporciona a la IA listas de palabras válidas instaladas en tu Kali (ej. <code className="text-error font-bold">/usr/share/wordlists/rockyou.txt</code>).
              </div>

              <div className="bg-surface-container p-3 rounded font-mono text-xs">
                <p className="text-tertiary mb-1"># Solicitar auditoría SSH:</p>
                <p className="text-on-surface">"Genera un comando hydra para probar contraseñas SSH usando rockyou.txt con el usuario 'admin'"</p>
              </div>
              
              <div className="bg-surface-container p-3 rounded font-mono text-xs mt-2">
                <p className="text-tertiary mb-1"># Solicitar auditoría FTP/Web:</p>
                <p className="text-on-surface">"Usa hydra para comprobar el servicio FTP con los usuarios root y admin"</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low p-space-lg rounded-lg border border-outline-variant">
            <h2 className="font-headline-sm text-headline-sm uppercase border-b border-outline-variant pb-2 mb-4 text-primary">
              Análisis Inteligente de Salidas
            </h2>
            <div className="space-y-4 font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              <p>
                La función más poderosa del Guardián es leer la terminal por ti.
              </p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Ejecuta un comando en la terminal (ej. <code className="bg-surface-container px-1 py-0.5 rounded">nmap</code>).</li>
                <li>Activa el interruptor <strong className="text-primary">"Leer salida de la terminal"</strong> debajo del panel de chat.</li>
                <li>Escribe: <em>"Analiza estos resultados y dime qué vulnerabilidades ves o qué comando debo ejecutar a continuación."</em></li>
                <li>La IA procesará la salida técnica y te sugerirá el siguiente paso exacto en la cadena de ataque/auditoría.</li>
              </ol>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
