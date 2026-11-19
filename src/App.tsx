import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { PatientsPage } from '@/features/patients/PatientsPage';
import { PatientFormPage } from '@/features/patients/PatientFormPage';
import { PatientDetailPage } from '@/features/patients/PatientDetailPage';
import { MedicalRecordsPage } from '@/features/medical-records/MedicalRecordsPage';
import { MedicalRecordFormPage } from '@/features/medical-records/MedicalRecordFormPage';
import { MedicalRecordDetailPage } from '@/features/medical-records/MedicalRecordDetailPage';
import { UsersPage } from '@/features/users/UsersPage';
import { PrescriptionsPage } from '@/features/prescriptions/PrescriptionsPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="pasien" element={<PatientsPage />} />
          <Route path="pasien/baru" element={<ProtectedRoute allowedRoles={['admin']}><PatientFormPage /></ProtectedRoute>} />
          <Route path="pasien/:id/edit" element={<ProtectedRoute allowedRoles={['admin']}><PatientFormPage /></ProtectedRoute>} />
          <Route path="pasien/:id" element={<PatientDetailPage />} />
          <Route path="rekam-medis" element={<MedicalRecordsPage />} />
          <Route path="resep" element={<PrescriptionsPage />} />
          <Route path="rekam-medis/baru" element={<MedicalRecordFormPage />} />
          <Route path="rekam-medis/:id/edit" element={<ProtectedRoute allowedRoles={['dokter']}><MedicalRecordFormPage /></ProtectedRoute>} />
          <Route path="rekam-medis/:id" element={<MedicalRecordDetailPage />} />
          <Route path="pengguna" element={<ProtectedRoute allowedRoles={['admin']}><UsersPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
