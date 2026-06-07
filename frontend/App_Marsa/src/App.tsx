import { Navigate, Route, Routes } from 'react-router-dom';
import CraneLayoutRoute from './routes/CraneLayoutRoute';
import DashboardRoutePage from './routes/DashboardRoutePage';

const App = () => {
  return (
    <Routes>
      <Route element={<CraneLayoutRoute />}>
        <Route path="/dashboard" element={<DashboardRoutePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
