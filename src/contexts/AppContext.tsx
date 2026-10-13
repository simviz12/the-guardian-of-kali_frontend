import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';
type Language = 'es' | 'en';

interface AppContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  es: {
    // Top bar & Footer
    'app.title': 'THE GUARDIAN OF KALICHE',
    'app.native': 'NATIVO WSL2',
    'app.scope': 'ALCANCE',
    'app.status.ok': 'API OK',
    'app.status.error': 'API ERROR',
    'nav.terminal': 'TERMINAL',
    'nav.history': 'HISTORIAL',
    'nav.settings': 'AJUSTES',
    'nav.guide': 'GUÍA',
    'nav.logout': 'SALIR DE SESIÓN',
    'footer.tunnel': 'TÚNEL: TUN0 (SEGURO)',
    'footer.session': 'ESTADO DE SESIÓN: PROTEGIDO',
    'footer.kernel': 'WSL2 KERNEL',

    // Tooltips
    'tooltip.terminal': 'Matriz de Terminal',
    'tooltip.history': 'Registro de Auditoría',
    'tooltip.settings': 'Ajustes del Sistema',
    'tooltip.guide': 'Guía Operativa',

    // Login & Register
    'login.title': 'Acceso Restringido',
    'login.subtitle': 'Por favor, ingrese sus credenciales para continuar.',
    'login.email': 'Correo Electrónico',
    'login.password': 'Contraseña',
    'login.confirm_password': 'Confirmar Contraseña',
    'login.button': 'Entrar al Sistema',
    'login.register_button': 'Registrar Operador',
    'login.tab_login': 'Iniciar Sesión',
    'login.tab_register': 'Crear Cuenta',
    'login.no_account': '¿No tienes una cuenta?',
    'login.has_account': '¿Ya tienes una cuenta registrada?',
    'login.switch_to_register': 'Crear cuenta nueva',
    'login.switch_to_login': 'Iniciar sesión existente',
    'login.error_email': 'Por favor ingrese un correo válido',
    'login.error_password': 'La contraseña debe tener al menos 6 caracteres',
    'login.error_password_match': 'Las contraseñas no coinciden',
    'login.error_auth': 'Credenciales incorrectas o usuario no registrado',
    'login.error_exists': 'Ya existe una cuenta con este correo',
    'login.success_register': '¡Cuenta creada con éxito! Iniciando sesión...',

    // Session Setup
    'session.setup': 'NUEVA SESIÓN DE OPERACIONES',
    'session.subtitle': 'Inicialización de entorno y parámetros de seguridad Zero-Trust',
    'session.req.title': 'Requisito de Configuración',
    'session.req.desc': 'Para que The Guardian of Kaliche funcione, necesitas proveer una API Key de Google Gemini.',
    'session.req.key_placeholder': 'Pega tu clave AIzaSy... aquí',
    'session.req.save_btn': 'Guardar y Continuar',
    'session.req.saving': 'Guardando...',
    'session.env.title': 'ENTORNO DE EJECUCIÓN',
    'session.env.distro': 'Distribución Nativa: Kali Linux',
    'session.env.sub': 'Sesión restringida con aislamiento de comandos',
    'session.op.label': 'Identificador del Operador',
    'session.scope.label': 'Alcance Autorizado (IP/Dominio)',
    'session.scope.restricted': 'RESTRINGIDO',
    'session.ports.label': 'Puertos Permitidos',
    'session.ports.optional': 'OPCIONAL',
    'session.ports.placeholder': 'Ej. 80, 443, 8080-8090 o dejar en blanco',
    'session.mode.label': 'Modo de Operación del Copiloto IA',
    'session.mode.suggestion': 'Sugerencia',
    'session.mode.suggestion_desc': 'La IA sugiere comandos; el operador siempre debe aprobar manualmente cada ejecución.',
    'session.mode.autonomous': 'Autonomía',
    'session.mode.autonomous_desc': 'La IA ejecuta comandos seguros automáticamente. Alto riesgo requiere aprobación.',
    'session.btn.init': 'Iniciar Sesión Segura',
    'session.btn.initializing': 'Estableciendo Enlace Zero-Trust...',

    // Terminal
    'terminal.placeholder': 'Escribe tu comando aquí (ej. nmap -sV 10.10.10.10)...',
    'terminal.execute': 'EJECUTAR COMANDO',
    'terminal.hint': 'Presiona ↵ Enter para ejecutar directamente en la sesión WSL2',

    // Chat
    'chat.header.title': 'Copiloto de Seguridad IA',
    'chat.header.sub': 'Gemini 2.5 • Razonamiento SecOps',
    'chat.online': 'ONLINE',
    'chat.guardian_ai': 'Guardian AI',
    'chat.suggested_cmd': 'COMANDO SUGERIDO',
    'chat.risk_analyzed': 'Riesgo: Analizado',
    'chat.btn.use': 'USAR COMANDO',
    'chat.btn.dismiss': 'DESCARTAR',
    'chat.cmd_executed': 'Comando ejecutado',
    'chat.cmd_rejected': 'Comando descartado',
    'chat.user_analyst': 'Analista de Seguridad',
    'chat.analyzing': 'Analizando...',
    'chat.quick.recon': 'Reconocimiento',
    'chat.quick.ports': 'Top Puertos',
    'chat.quick.web': 'Enum Web',
    'chat.placeholder': 'Pregunta al Copiloto IA...',
    'chat.send': 'ENVIAR',

    // History
    'history.title': 'HISTORIAL DE AUDITORÍA GLOBAL',
    'history.sub': 'Registro inmutable de todas las ejecuciones de comandos en la sesión',
    'history.export': 'EXPORTAR CSV',
    'history.total': 'TOTAL COMANDOS',
    'history.ai_actions': 'ACCIONES DE LA IA',
    'history.blocked': 'BLOQUEADOS POR POLÍTICA',
    'history.status_active': 'ESTADO: AUDITANDO EN VIVO',
    'history.filter_all': 'Todos los Orígenes',
    'history.filter_manual': 'Solo Manual (Operador)',
    'history.filter_ai': 'Solo IA Copiloto',
    'history.th.time': 'HORA / TIMESTAMP',
    'history.th.operator': 'OPERADOR',
    'history.th.origin': 'ORIGEN',
    'history.th.command': 'COMANDO EJECUTADO',
    'history.th.risk': 'NIVEL DE RIESGO',
    'history.th.status': 'ESTADO POLÍTICA',
    'history.empty': 'No hay comandos registrados en el historial para esta sesión.',

    // Settings
    'settings.title': 'AJUSTES DEL SISTEMA',
    'settings.desc': 'Configura los parámetros del sistema e integraciones externas.',
    'settings.ai_config': 'Configuración del Copiloto IA',
    'settings.api_key_label': 'Clave de API de Google Gemini',
    'settings.api_key_desc': 'The Guardian of Kaliche utiliza Google Gemini 2.5 Flash para recopilación rápida de inteligencia y generación de comandos.',
    'settings.api_key_configured': '✓ API Key ya configurada.',
    'settings.api_key_missing': '✗ API Key no encontrada.',
    'settings.api_key_placeholder': 'Reemplazar API Key actual...',
    'settings.save_btn': 'Actualizar API Key',
    'settings.saving_btn': 'Guardando...',
    'settings.theme': 'Tema Visual',
    'settings.language': 'Idioma',

    // Guide
    'guide.title': 'GUÍA OPERATIVA ZERO-TRUST',
    'guide.desc': 'Documentación técnica y reglas de operación (RoE) del Copiloto IA.',
    'guide.roe_title': 'Reglas de Operación (Rules of Engagement)',
    'guide.roe_text': 'The Guardian of Kaliche es un copiloto de seguridad ofensiva/defensiva diseñado bajo una estricta arquitectura Zero-Trust. Todos los comandos propuestos por la IA son evaluados por un motor de políticas de aislamiento antes de poder ejecutarse.',
    'guide.scope_title': 'Restricción de Alcance (Scope):',
    'guide.scope_desc': 'La IA solo propondrá y ejecutará comandos que apunten al alcance (Scope) autorizado al inicio de la sesión.',
    'guide.ports_title': 'Validación de Puertos:',
    'guide.ports_desc': 'Si configuraste puertos permitidos, cualquier intento de escanear o atacar puertos fuera de la lista será bloqueado de inmediato.',
    'guide.destructive_title': 'Bloqueo de Destrucción:',
    'guide.destructive_desc': 'Comandos que pongan en riesgo la integridad del sistema (ej. rm -rf /, alteración de configuraciones locales) son rechazados.',
    'guide.recon_title': 'Módulo de Reconocimiento y Escaneo (Ejemplos Seguros)',
    'guide.recon_desc': 'Puedes solicitar a la IA que estructure comandos de red complejos. Estos son algunos ejemplos de lo que puedes pedirle al copiloto en el chat:',
    'guide.dns_title': '# Solicitar un escaneo pasivo o DNS:',
    'guide.dns_ex1': '"Realiza una transferencia de zona DNS al dominio objetivo"',
    'guide.dns_ex2': '"Usa theHarvester para recopilar correos del alcance autorizado"',
    'guide.nmap_title': '# Solicitar un escaneo activo de puertos (Nmap):',
    'guide.nmap_ex1': '"Haz un escaneo rápido de los top 100 puertos"',
    'guide.nmap_ex2': '"Ejecuta nmap con detección de versiones y SO en el objetivo"',
    'guide.arch_title': 'Arquitectura Zero-Trust y Flujo de Comandos',
    'guide.arch_desc': 'Cada sugerencia o ejecución manual pasa por una tubería de validación previa antes de interactuar con el entorno Linux.',
    'guide.step1': '1. Propuesta de Comando',
    'guide.step1_desc': 'La IA genera un comando parametrizado analizando el objetivo autorizado.',
    'guide.step2': '2. Motor de Políticas',
    'guide.step2_desc': 'Verificación de listas negras, análisis de alcance IP/dominio y reglas de aislamiento.',
    'guide.step3': '3. Ejecución Controlada',
    'guide.step3_desc': 'Inyección segura en Kali Linux (WSL2) y auditoría inmutable en SQLite.'
  },
  en: {
    // Top bar & Footer
    'app.title': 'THE GUARDIAN OF KALICHE',
    'app.native': 'WSL2 NATIVE',
    'app.scope': 'SCOPE',
    'app.status.ok': 'API OK',
    'app.status.error': 'API ERROR',
    'nav.terminal': 'TERMINAL',
    'nav.history': 'HISTORY',
    'nav.settings': 'SETTINGS',
    'nav.guide': 'GUIDE',
    'nav.logout': 'LOGOUT',
    'footer.tunnel': 'TUNNEL: TUN0 (SECURE)',
    'footer.session': 'SESSION STATUS: PROTECTED',
    'footer.kernel': 'WSL2 KERNEL',

    // Tooltips
    'tooltip.terminal': 'Terminal Matrix',
    'tooltip.history': 'Audit Log',
    'tooltip.settings': 'System Settings',
    'tooltip.guide': 'Operational Guide',

    // Login & Register
    'login.title': 'Restricted Access',
    'login.subtitle': 'Please enter your credentials to continue.',
    'login.email': 'Email Address',
    'login.password': 'Password',
    'login.confirm_password': 'Confirm Password',
    'login.button': 'Enter System',
    'login.register_button': 'Register Operator',
    'login.tab_login': 'Sign In',
    'login.tab_register': 'Create Account',
    'login.no_account': "Don't have an account?",
    'login.has_account': 'Already registered?',
    'login.switch_to_register': 'Create new account',
    'login.switch_to_login': 'Sign in existing account',
    'login.error_email': 'Please enter a valid email',
    'login.error_password': 'Password must be at least 6 characters',
    'login.error_password_match': 'Passwords do not match',
    'login.error_auth': 'Invalid credentials or operator not registered',
    'login.error_exists': 'An account already exists with this email',
    'login.success_register': 'Account created successfully! Logging in...',

    // Session Setup
    'session.setup': 'NEW OPERATIONS SESSION',
    'session.subtitle': 'Environment initialization and Zero-Trust security parameters',
    'session.req.title': 'Configuration Requirement',
    'session.req.desc': 'For The Guardian of Kaliche to operate, you must provide a Google Gemini API Key.',
    'session.req.key_placeholder': 'Paste your AIzaSy... key here',
    'session.req.save_btn': 'Save and Continue',
    'session.req.saving': 'Saving...',
    'session.env.title': 'EXECUTION ENVIRONMENT',
    'session.env.distro': 'Native Distro: Kali Linux',
    'session.env.sub': 'Restricted session with command isolation',
    'session.op.label': 'Operator Identifier',
    'session.scope.label': 'Authorized Scope (IP/Domain)',
    'session.scope.restricted': 'RESTRICTED',
    'session.ports.label': 'Allowed Ports',
    'session.ports.optional': 'OPTIONAL',
    'session.ports.placeholder': 'E.g. 80, 443, 8080-8090 or leave blank',
    'session.mode.label': 'AI Copilot Operation Mode',
    'session.mode.suggestion': 'Suggestion',
    'session.mode.suggestion_desc': 'The AI suggests commands; the operator must always manually approve each execution.',
    'session.mode.autonomous': 'Autonomy',
    'session.mode.autonomous_desc': 'The AI executes safe commands automatically. High risk requires approval.',
    'session.btn.init': 'Start Secure Session',
    'session.btn.initializing': 'Establishing Zero-Trust Link...',

    // Terminal
    'terminal.placeholder': 'Type your command here (e.g. nmap -sV 10.10.10.10)...',
    'terminal.execute': 'EXECUTE COMMAND',
    'terminal.hint': 'Press ↵ Enter to execute directly inside the WSL2 session',

    // Chat
    'chat.header.title': 'AI Security Copilot',
    'chat.header.sub': 'Gemini 2.5 • SecOps Reasoning',
    'chat.online': 'ONLINE',
    'chat.guardian_ai': 'Guardian AI',
    'chat.suggested_cmd': 'SUGGESTED COMMAND',
    'chat.risk_analyzed': 'Risk: Analyzed',
    'chat.btn.use': 'USE COMMAND',
    'chat.btn.dismiss': 'DISMISS',
    'chat.cmd_executed': 'Command executed',
    'chat.cmd_rejected': 'Command dismissed',
    'chat.user_analyst': 'Security Analyst',
    'chat.analyzing': 'Analyzing...',
    'chat.quick.recon': 'Recon',
    'chat.quick.ports': 'Top Ports',
    'chat.quick.web': 'Web Enum',
    'chat.placeholder': 'Ask the AI Copilot...',
    'chat.send': 'SEND',

    // History
    'history.title': 'GLOBAL AUDIT HISTORY',
    'history.sub': 'Immutable record of all command executions in this session',
    'history.export': 'EXPORT CSV',
    'history.total': 'TOTAL COMMANDS',
    'history.ai_actions': 'AI ACTIONS',
    'history.blocked': 'BLOCKED BY POLICY',
    'history.status_active': 'STATUS: LIVE AUDITING',
    'history.filter_all': 'All Origins',
    'history.filter_manual': 'Manual Only (Operator)',
    'history.filter_ai': 'AI Copilot Only',
    'history.th.time': 'TIME / TIMESTAMP',
    'history.th.operator': 'OPERATOR',
    'history.th.origin': 'ORIGIN',
    'history.th.command': 'EXECUTED COMMAND',
    'history.th.risk': 'RISK LEVEL',
    'history.th.status': 'POLICY DECISION',
    'history.empty': 'No commands recorded in the history for this session.',

    // Settings
    'settings.title': 'SYSTEM SETTINGS',
    'settings.desc': 'Configure system parameters and external integrations.',
    'settings.ai_config': 'AI Copilot Configuration',
    'settings.api_key_label': 'Google Gemini API Key',
    'settings.api_key_desc': 'The Guardian of Kaliche uses Google Gemini 2.5 Flash for rapid intelligence gathering and command generation.',
    'settings.api_key_configured': '✓ API Key already configured.',
    'settings.api_key_missing': '✗ API Key not found.',
    'settings.api_key_placeholder': 'Replace current API Key...',
    'settings.save_btn': 'Update API Key',
    'settings.saving_btn': 'Saving...',
    'settings.theme': 'Visual Theme',
    'settings.language': 'Language',

    // Guide
    'guide.title': 'ZERO-TRUST OPERATIONAL GUIDE',
    'guide.desc': 'Technical documentation and Rules of Engagement (RoE) for the AI Copilot.',
    'guide.roe_title': 'Rules of Engagement (RoE)',
    'guide.roe_text': 'The Guardian of Kaliche is an offensive/defensive security co-pilot designed under a strict Zero-Trust architecture. All commands suggested by the AI are evaluated by an isolation policy engine before execution.',
    'guide.scope_title': 'Scope Restriction:',
    'guide.scope_desc': 'The AI will only propose and execute commands targeting the authorized Scope defined at session start.',
    'guide.ports_title': 'Port Validation:',
    'guide.ports_desc': 'If you configured allowed ports, any attempt to scan or attack outside that list will be immediately blocked.',
    'guide.destructive_title': 'Destruction Blocking:',
    'guide.destructive_desc': 'Commands threatening system integrity (e.g. rm -rf /, local config tampering) are strictly rejected.',
    'guide.recon_title': 'Reconnaissance & Scanning Module (Safe Examples)',
    'guide.recon_desc': 'You can request complex network commands from the AI. Here are examples of what you can ask the co-pilot in chat:',
    'guide.dns_title': '# Request passive or DNS reconnaissance:',
    'guide.dns_ex1': '"Perform a DNS zone transfer on the target domain"',
    'guide.dns_ex2': '"Use theHarvester to gather emails for the authorized scope"',
    'guide.nmap_title': '# Request active port scanning (Nmap):',
    'guide.nmap_ex1': '"Run a fast scan on the top 100 ports"',
    'guide.nmap_ex2': '"Execute nmap with version and OS detection against the target"',
    'guide.arch_title': 'Zero-Trust Architecture & Command Flow',
    'guide.arch_desc': 'Every suggestion or manual execution goes through a validation pipeline before touching the Linux environment.',
    'guide.step1': '1. Command Proposal',
    'guide.step1_desc': 'The AI generates a parameterized command targeting the authorized scope.',
    'guide.step2': '2. Policy Engine',
    'guide.step2_desc': 'Blacklist check, IP/domain scope validation, and isolation rules.',
    'guide.step3': '3. Controlled Execution',
    'guide.step3_desc': 'Safe injection into Kali Linux (WSL2) with immutable SQLite audit logging.'
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'dark';
  });
  
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'es';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    localStorage.setItem('language', newLang);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['es']?.[key] || key;
  };

  return (
    <AppContext.Provider value={{ theme, setTheme, language, setLanguage, t }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
