import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Pages/Home';
import Header from './components/Header';
import Footer from './components/Footer';
import News from './Pages/News';
import ScrollToTop from './components/ScrollToTop';
import Admin from './Pages/Admin';
import Login from './Pages/Login';

const App = () => {
    return (
        <Router>
            <ScrollToTop />
            <Header />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/news" element={<News />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/login" element={<Login />} />
            </Routes>
            <Footer />
        </Router>
    );
};

export default App;