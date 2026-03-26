import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import StudyMode from './pages/StudyMode'
import GamingMode from './pages/GamingMode'
import KidsMode from './pages/KidsMode'
import AnimeMode from './pages/AnimeMode'
import FashionMode from './pages/FashionMode'
import CakeMode from './pages/CakeMode'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/study" element={<StudyMode />} />
        <Route path="/gaming" element={<GamingMode />} />
        <Route path="/kids" element={<KidsMode />} />
        <Route path="/anime" element={<AnimeMode />} />
        <Route path="/fashion" element={<FashionMode />} />
        <Route path="/cake" element={<CakeMode />} />
      </Routes>
    </Router>
  )
}

export default App
