// =====================================================
// Duck Migration - i18n
// Utilitário simples de internacionalização do frontend
// =====================================================

export type SupportedLanguage = 'en' | 'pt-BR' | 'es';

const FALLBACK_LANGUAGE: SupportedLanguage = 'en';

const messages = {
  'en': {
    // Sidebar / layout
    'sidebar.title': 'Duck Migration',
    'sidebar.connections': 'Connections',
    'sidebar.newMigration': 'New Migration',
    'sidebar.history': 'History',
    'sidebar.settings': 'Settings',
    'sidebar.footerTagline': 'MongoDB Migration Tool',

    // Wizard - steps
    'wizard.step.source': 'Source',
    'wizard.step.target': 'Target',
    'wizard.step.collections': 'Collections',
    'wizard.step.configure': 'Configure',
    'wizard.step.review': 'Review',
    'wizard.step.execute': 'Execute',
    'wizard.nav.back': 'Back',
    'wizard.nav.next': 'Next',

    // Connections list
    'connections.title': 'Connections',
    'connections.subtitle': 'Manage your MongoDB connections',
    'connections.add': 'Add Connection',
    'connections.loading': 'Loading connections...',
    'connections.emptyTitle': 'No connections yet',
    'connections.emptyDescription': 'Add your first MongoDB connection to get started.',
    'connections.test': 'Test',
    'connections.confirm': 'Confirm',
    'connections.cancel': 'Cancel',
    'connections.testFailedFallback': 'Test failed',
    'connections.createdAt': 'Created',

    // Connection form
    'connectionForm.newTitle': 'New Connection',
    'connectionForm.editTitle': 'Edit Connection',
    'connectionForm.connectionName': 'Connection Name',
    'connectionForm.connectionNamePlaceholder': 'e.g. Production, Staging',
    'connectionForm.connectionString': 'Connection String',
    'connectionForm.connectionStringPlaceholder': 'mongodb://localhost:27017',
    'connectionForm.testConnection': 'Test Connection',
    'connectionForm.testing': 'Testing...',
    'connectionForm.testFailedFallback': 'Connection test failed',
    'connectionForm.cancel': 'Cancel',
    'connectionForm.add': 'Add Connection',
    'connectionForm.saveChanges': 'Save Changes',
    'connectionForm.saveFailedFallback': 'Failed to save connection',

    // History
    'history.title': 'Migration History',
    'history.subtitle': 'View past migration runs and their results',
    'history.loading': 'Loading history...',
    'history.emptyTitle': 'No migrations yet',
    'history.emptyDescription':
      'Migration history will appear here after your first run.',
    'history.table.sourceTarget': 'Source / Target',
    'history.table.collections': 'Collections',
    'history.table.documents': 'Documents',
    'history.table.duration': 'Duration',
    'history.table.status': 'Status',
    'history.status.completed': 'Completed',
    'history.status.failed': 'Failed',
    'history.status.partial': 'Partial',
    'history.detail.started': 'Started',
    'history.detail.completed': 'Completed',
    'history.detail.collections': 'Collections',
    'history.detail.collectionsSuffix': 'collections',
    'history.detail.documents': 'Documents',
    'history.detail.documentsMigratedSuffix': 'migrated',
    'history.detail.validationResults': 'Validation Results:',
    'history.detail.validationCollection': 'Collection',
    'history.detail.validationSource': 'Source',
    'history.detail.validationTarget': 'Target',
    'history.detail.validationMatch': 'Match',
    'history.detail.collectionsMigrated': 'Collections migrated:',
    'history.loadFailedFallback': 'Failed to load migration history',

    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Adjust your Duck Migration preferences',
    'settings.language.sectionTitle': 'Language',
    'settings.language.sectionDescription':
      'Choose the language for the application interface.',
    'settings.language.label': 'Interface language',
    'settings.language.option.en': 'English',
    'settings.language.option.pt-BR': 'Português (Brasil)',
    'settings.language.option.es': 'Español',
  },
  'pt-BR': {
    'sidebar.title': 'Duck Migration',
    'sidebar.connections': 'Conexões',
    'sidebar.newMigration': 'Nova Migração',
    'sidebar.history': 'Histórico',
    'sidebar.settings': 'Configurações',
    'sidebar.footerTagline': 'Ferramenta de migração MongoDB',

    'wizard.step.source': 'Origem',
    'wizard.step.target': 'Destino',
    'wizard.step.collections': 'Collections',
    'wizard.step.configure': 'Configurar',
    'wizard.step.review': 'Revisar',
    'wizard.step.execute': 'Executar',
    'wizard.nav.back': 'Voltar',
    'wizard.nav.next': 'Avançar',

    'connections.title': 'Conexões',
    'connections.subtitle': 'Gerencie suas conexões MongoDB',
    'connections.add': 'Adicionar conexão',
    'connections.loading': 'Carregando conexões...',
    'connections.emptyTitle': 'Nenhuma conexão ainda',
    'connections.emptyDescription':
      'Adicione sua primeira conexão MongoDB para começar.',
    'connections.test': 'Testar',
    'connections.confirm': 'Confirmar',
    'connections.cancel': 'Cancelar',
    'connections.testFailedFallback': 'Falha ao testar',
    'connections.createdAt': 'Criada',

    'connectionForm.newTitle': 'Nova conexão',
    'connectionForm.editTitle': 'Editar conexão',
    'connectionForm.connectionName': 'Nome da conexão',
    'connectionForm.connectionNamePlaceholder': 'ex.: Produção, Homologação',
    'connectionForm.connectionString': 'Connection string',
    'connectionForm.connectionStringPlaceholder': 'mongodb://localhost:27017',
    'connectionForm.testConnection': 'Testar conexão',
    'connectionForm.testing': 'Testando...',
    'connectionForm.testFailedFallback': 'Falha ao testar conexão',
    'connectionForm.cancel': 'Cancelar',
    'connectionForm.add': 'Adicionar conexão',
    'connectionForm.saveChanges': 'Salvar alterações',
    'connectionForm.saveFailedFallback': 'Falha ao salvar conexão',

    'history.title': 'Histórico de migrações',
    'history.subtitle': 'Veja execuções de migração anteriores e seus resultados',
    'history.loading': 'Carregando histórico...',
    'history.emptyTitle': 'Nenhuma migração ainda',
    'history.emptyDescription':
      'O histórico de migração aparecerá aqui após sua primeira execução.',
    'history.table.sourceTarget': 'Origem / Destino',
    'history.table.collections': 'Collections',
    'history.table.documents': 'Documentos',
    'history.table.duration': 'Duração',
    'history.table.status': 'Status',
    'history.status.completed': 'Concluída',
    'history.status.failed': 'Falhou',
    'history.status.partial': 'Parcial',
    'history.detail.started': 'Iniciada',
    'history.detail.completed': 'Concluída',
    'history.detail.collections': 'Collections',
    'history.detail.collectionsSuffix': 'collections',
    'history.detail.documents': 'Documentos',
    'history.detail.documentsMigratedSuffix': 'migrados',
    'history.detail.validationResults': 'Resultados de validação:',
    'history.detail.validationCollection': 'Collection',
    'history.detail.validationSource': 'Origem',
    'history.detail.validationTarget': 'Destino',
    'history.detail.validationMatch': 'Match',
    'history.detail.collectionsMigrated': 'Collections migradas:',
    'history.loadFailedFallback': 'Falha ao carregar histórico de migrações',

    'settings.title': 'Configurações',
    'settings.subtitle': 'Ajuste as preferências do Duck Migration',
    'settings.language.sectionTitle': 'Idioma',
    'settings.language.sectionDescription':
      'Escolha o idioma da interface do aplicativo.',
    'settings.language.label': 'Idioma da interface',
    'settings.language.option.en': 'English',
    'settings.language.option.pt-BR': 'Português (Brasil)',
    'settings.language.option.es': 'Español',
  },
  'es': {
    'sidebar.title': 'Duck Migration',
    'sidebar.connections': 'Conexiones',
    'sidebar.newMigration': 'Nueva migración',
    'sidebar.history': 'Historial',
    'sidebar.settings': 'Configuración',
    'sidebar.footerTagline': 'Herramienta de migración MongoDB',

    'wizard.step.source': 'Origen',
    'wizard.step.target': 'Destino',
    'wizard.step.collections': 'Colecciones',
    'wizard.step.configure': 'Configurar',
    'wizard.step.review': 'Revisar',
    'wizard.step.execute': 'Ejecutar',
    'wizard.nav.back': 'Atrás',
    'wizard.nav.next': 'Siguiente',

    'connections.title': 'Conexiones',
    'connections.subtitle': 'Administra tus conexiones de MongoDB',
    'connections.add': 'Agregar conexión',
    'connections.loading': 'Cargando conexiones...',
    'connections.emptyTitle': 'Aún no hay conexiones',
    'connections.emptyDescription':
      'Agrega tu primera conexión de MongoDB para comenzar.',
    'connections.test': 'Probar',
    'connections.confirm': 'Confirmar',
    'connections.cancel': 'Cancelar',
    'connections.testFailedFallback': 'Error al probar',
    'connections.createdAt': 'Creada',

    'connectionForm.newTitle': 'Nueva conexión',
    'connectionForm.editTitle': 'Editar conexión',
    'connectionForm.connectionName': 'Nombre de la conexión',
    'connectionForm.connectionNamePlaceholder': 'p.ej. Producción, Staging',
    'connectionForm.connectionString': 'Connection string',
    'connectionForm.connectionStringPlaceholder': 'mongodb://localhost:27017',
    'connectionForm.testConnection': 'Probar conexión',
    'connectionForm.testing': 'Probando...',
    'connectionForm.testFailedFallback': 'Error al probar la conexión',
    'connectionForm.cancel': 'Cancelar',
    'connectionForm.add': 'Agregar conexión',
    'connectionForm.saveChanges': 'Guardar cambios',
    'connectionForm.saveFailedFallback': 'Error al guardar la conexión',

    'history.title': 'Historial de migraciones',
    'history.subtitle': 'Consulta ejecuciones de migración pasadas y sus resultados',
    'history.loading': 'Cargando historial...',
    'history.emptyTitle': 'Aún no hay migraciones',
    'history.emptyDescription':
      'El historial de migraciones aparecerá aquí después de tu primera ejecución.',
    'history.table.sourceTarget': 'Origen / Destino',
    'history.table.collections': 'Colecciones',
    'history.table.documents': 'Documentos',
    'history.table.duration': 'Duración',
    'history.table.status': 'Estado',
    'history.status.completed': 'Completada',
    'history.status.failed': 'Fallida',
    'history.status.partial': 'Parcial',
    'history.detail.started': 'Iniciada',
    'history.detail.completed': 'Completada',
    'history.detail.collections': 'Colecciones',
    'history.detail.collectionsSuffix': 'colecciones',
    'history.detail.documents': 'Documentos',
    'history.detail.documentsMigratedSuffix': 'migrados',
    'history.detail.validationResults': 'Resultados de validación:',
    'history.detail.validationCollection': 'Colección',
    'history.detail.validationSource': 'Origen',
    'history.detail.validationTarget': 'Destino',
    'history.detail.validationMatch': 'Match',
    'history.detail.collectionsMigrated': 'Colecciones migradas:',
    'history.loadFailedFallback': 'Error al cargar el historial de migraciones',

    'settings.title': 'Configuración',
    'settings.subtitle': 'Ajusta las preferencias de Duck Migration',
    'settings.language.sectionTitle': 'Idioma',
    'settings.language.sectionDescription':
      'Elige el idioma de la interfaz de la aplicación.',
    'settings.language.label': 'Idioma de la interfaz',
    'settings.language.option.en': 'English',
    'settings.language.option.pt-BR': 'Português (Brasil)',
    'settings.language.option.es': 'Español',
  },
} as const;

export type TranslationKey = keyof (typeof messages)[typeof FALLBACK_LANGUAGE];

export function translate(language: SupportedLanguage, key: TranslationKey): string {
  const langMessages = messages[language] ?? messages[FALLBACK_LANGUAGE];
  if (key in langMessages) {
    return langMessages[key as keyof typeof langMessages];
  }
  const fallbackMessages = messages[FALLBACK_LANGUAGE];
  return fallbackMessages[key] ?? key;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'pt-BR', 'es'];

