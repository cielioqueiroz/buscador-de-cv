import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { HomePage } from './pages/HomePage';
import { ResultsPage } from './pages/ResultsPage';
import { CVProfilePage } from './pages/CVProfilePage';
import './index.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/profile" element={<CVProfilePage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
