import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import QuizPage from "./pages/Quiz";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminResultsPage from "./pages/AdminResultsPage";
import AdminSessionListPage from "./pages/admin/AdminSessionListPage";
import AdminQuestionManagerPage from "./pages/admin/AdminQuestionManagerPage";
import SessionListPage from "./pages/SessionListPage";
import NotFound from "./pages/NotFound";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/sessions" element={<SessionListPage />} />
        <Route path="/quiz/:sessionId" element={<QuizPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/results" element={<AdminResultsPage />} />
        <Route path="/admin/sessions" element={<AdminSessionListPage />} />
        <Route path="/admin/sessions/:sessionId" element={<AdminQuestionManagerPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;