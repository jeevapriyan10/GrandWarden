import React, { useState } from 'react';
import axios from 'axios';
import Landing from './components/Landing';
import VerificationForm from './components/VerificationForm';
import ResultDisplay from './components/ResultDisplay';
import Feed from './components/Feed';
import Trending from './components/Trending';
import MessageBanner from './components/MessageBanner';
import { CheckCircle, TrendingUp, BarChart3, Menu, X } from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || '';

function App() {
    const [view, setView] = useState('landing');
    const [verificationResult, setVerificationResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleVerification = async (text) => {
        setLoading(true);
        try {
            const response = await axios.post(`${BACKEND}/api/verify`, { text });
            setVerificationResult(response.data);
            showMessage('success', '✅ Analysis complete!');
        } catch (error) {
            console.error('Verification error:', error);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to verify text';
            showMessage('error', '❌ ' + errorMsg);
            setVerificationResult(null);
        } finally {
            setLoading(false);
        }
    };

    const changeView = (newView) => {
        setView(newView);
        setMobileMenuOpen(false);
    };

    if (view === 'landing') {
        return (
            <Landing
                onGetStarted={() => setView('verify')}
                onBrowseFeed={() => setView('feed')}
            />
        );
    }

    return (
        <div>
            {/* Header */}
            <header className="header">
                <div className="container">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-sm">
                            <h3>GrandWarden</h3>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="desktop-nav flex gap-sm">
                            <button
                                onClick={() => changeView('verify')}
                                className={`tab ${view === 'verify' ? 'active' : ''}`}
                            >
                                <CheckCircle size={16} />
                                Fact Check
                            </button>
                            <button
                                onClick={() => changeView('feed')}
                                className={`tab ${view === 'feed' ? 'active' : ''}`}
                            >
                                <BarChart3 size={16} />
                                Feed
                            </button>
                            <button
                                onClick={() => changeView('trending')}
                                className={`tab ${view === 'trending' ? 'active' : ''}`}
                            >
                                <TrendingUp size={16} />
                                Trending
                            </button>
                            <button onClick={() => changeView('landing')} className="btn btn-secondary">
                                Home
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="mobile-menu-btn btn btn-secondary"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>

                    {/* Mobile Navigation */}
                    {mobileMenuOpen && (
                        <div className="mobile-nav">
                            <button
                                onClick={() => changeView('verify')}
                                className={`tab ${view === 'verify' ? 'active' : ''}`}
                            >
                                <CheckCircle size={16} />
                                Fact Check
                            </button>
                            <button
                                onClick={() => changeView('feed')}
                                className={`tab ${view === 'feed' ? 'active' : ''}`}
                            >
                                <BarChart3 size={16} />
                                Feed
                            </button>
                            <button
                                onClick={() => changeView('trending')}
                                className={`tab ${view === 'trending' ? 'active' : ''}`}
                            >
                                <TrendingUp size={16} />
                                Trending
                            </button>
                            <button onClick={() => changeView('landing')} className="btn btn-secondary">
                                Home
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {message && <MessageBanner message={message} onClose={() => setMessage(null)} />}

            <main style={{ padding: '3rem 0', minHeight: 'calc(100vh - 200px)' }}>
                <div className="container">
                    {view === 'verify' && (
                        <div>
                            <div className="text-center mb-xl">
                                <h2 className="mb-md">Fact Check Content</h2>
                                <p className="text-secondary" style={{ maxWidth: '700px', margin: '0 auto' }}>
                                    Submit news or factual claims for AI-powered verification. We only analyze news and public information - no personal attacks or spam.
                                </p>
                            </div>

                            <div className="grid grid-2">
                                <VerificationForm onSubmit={handleVerification} loading={loading} />
                                <ResultDisplay result={verificationResult} loading={loading} />
                            </div>
                        </div>
                    )}

                    {view === 'feed' && (
                        <div>
                            <div className="text-center mb-xl">
                                <h2 className="mb-md">Misinformation Feed</h2>
                                <p className="text-secondary">
                                    Browse all detected misinformation across categories. Upvote to help flag widespread false information.
                                </p>
                            </div>
                            <Feed />
                        </div>
                    )}

                    {view === 'trending' && (
                        <div>
                            <div className="text-center mb-xl">
                                <h2 className="mb-md">Trending Misinformation</h2>
                                <p className="text-secondary">
                                    Most upvoted and recent misinformation detections across the platform.
                                </p>
                            </div>
                            <Trending />
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '2rem 0', textAlign: 'center' }}>
                <div className="container">
                    <p className="text-secondary text-sm">
                        © 2026 GrandWarden. AI-Powered Misinformation Detection.
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default App;
