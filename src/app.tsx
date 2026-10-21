import { BrowserRouter, Navigate, Link, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { Home } from "./pages/Home";
import { LabRequests } from "./pages/LabRequests";
import { Registers } from "./pages/Registers";
import { Admission } from "./pages/Admission";

import { Medpoint } from "./pages/Medpoint";
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Home />} />
        <Route path="admission" element={<Admission />} />
        <Route path="baby-admissions" element={<Navigate to="/admission" replace />} />
        <Route path="newborn-records" element={<Navigate to="/admission" replace />} />
        <Route path="lab-request-register" element={<Registers kind="requests" />} />
        <Route path="lab-requests" element={<LabRequests />} />
        <Route path="request-proceeded" element={<Medpoint />} />
        <Route path="medpoint" element={<Navigate to="/request-proceeded" replace />} />
        <Route
          path="*"
          element={
            <div className="empty">
              <h1>Page not found</h1>
              <Link to="/">Return to overview</Link>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}
export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
