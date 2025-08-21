import { Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import ProfilePage from "./pages/ProfilePage";
import StudentTimetable from "./pages/StudentTimetable";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboardPage from "./pages/admin/Dashboard";
import AdminSubjectsPage from "./pages/admin/Subjects";
import AdminTimetablePage from "./pages/admin/Timetable";
import AdminFeedbackPage from "./pages/admin/Feedback";
import AdminAnalyticsPage from "./pages/admin/Analytics";
import StudentFeedbackHistoryPage from "./pages/StudentFeedbackHistoryPage";
import AdminBatchesPage from "./pages/admin/Batches";
import AdminStudentsPage from "./pages/admin/Students";

const App = () => (
  <div className="flex flex-col min-h-screen">
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Layout><Index /></Layout>} />
      <Route path="/login" element={<Layout><Login /></Layout>} />
      <Route path="/not-found" element={<Layout><NotFound /></Layout>} />

      {/* Authenticated Student Routes */}
      <Route 
        path="/student/dashboard" 
        element={
          <ProtectedRoute>
            <Layout><StudentDashboard /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/student/timetable"
        element={
          <ProtectedRoute>
            <Layout><StudentTimetable /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/student/feedback-history"
        element={
          <ProtectedRoute>
            <Layout><StudentFeedbackHistoryPage /></Layout>
          </ProtectedRoute>
        } 
      />
      
      {/* Profile Page (shared) */}
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Layout><ProfilePage /></Layout>
          </ProtectedRoute>
        } 
      />

      {/* Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="batches" element={<AdminBatchesPage />} />
        <Route path="subjects" element={<AdminSubjectsPage />} />
        <Route path="timetable" element={<AdminTimetablePage />} />
        <Route path="feedback" element={<AdminFeedbackPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="students" element={<AdminStudentsPage />} />
      </Route>

      {/* Catch-all for any other undefined routes */}
      <Route path="*" element={<Layout><NotFound /></Layout>} />
    </Routes>
  </div>
);

export default App;