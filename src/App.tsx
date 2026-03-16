import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ConnectionList } from './components/connections/ConnectionList';
import { WizardContainer } from './components/wizard/WizardContainer';
import { MigrationHistory } from './components/history/MigrationHistory';
import { SettingsPage } from './components/settings/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/connections" replace />} />
          <Route path="connections" element={<ConnectionList />} />
          <Route path="migration" element={<WizardContainer />} />
          <Route path="history" element={<MigrationHistory />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
