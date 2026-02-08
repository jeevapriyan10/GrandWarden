import React from 'react';
import { Shield, AlertTriangle, TrendingUp, Users, ArrowRight, Check } from 'lucide-react';

export default function Landing({ onGetStarted, onBrowseFeed }) {
    return (
        <div>
            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <h1 className="mb-lg">
                            AI-Powered Misinformation Detection
                            <br />
                            <span className="text-primary">Built with Gemini 3</span>
                        </h1>
                        <p style={{ fontSize: '1.125rem', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                            Verify text content for accuracy and reliability using advanced AI analysis.
                            Or browse the global feed of detected misinformation.
                        </p>
                        <div className="flex justify-center gap-md">
                            <button onClick={onBrowseFeed} className="btn btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
                                Browse Feed <TrendingUp size={20} />
                            </button>
                            <button onClick={onGetStarted} className="btn btn-secondary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
                                Fact Check <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section style={{ background: 'var(--surface)', padding: '3rem 0', borderTop: '1px solid var(--border)' }}>
                <div className="container">
                    <div className="grid grid-4">
                        <div className="stat-card">
                            <div className="stat-value">Gemini 3</div>
                            <div className="stat-label">Flash</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">Real-time</div>
                            <div className="stat-label">Analysis</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">Multi-Category</div>
                            <div className="stat-label">Detection</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">24/7</div>
                            <div className="stat-label">Available</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section style={{ padding: '4rem 0' }}>
                <div className="container">
                    <div className="text-center mb-xl">
                        <h2 className="mb-md">Core Features</h2>
                        <p className="text-secondary">Everything you need for content verification</p>
                    </div>

                    <div className="feature-grid">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <AlertTriangle size={24} />
                            </div>
                            <h4 className="mb-sm">AI-Powered Analysis</h4>
                            <p className="text-secondary text-sm">
                                Advanced Gemini 3 models trained to detect misinformation with high accuracy
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <Shield size={24} />
                            </div>
                            <h4 className="mb-sm">Confidence Scoring</h4>
                            <p className="text-secondary text-sm">
                                Get detailed confidence scores and explanations for every analysis
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <TrendingUp size={24} />
                            </div>
                            <h4 className="mb-sm">Category Detection</h4>
                            <p className="text-secondary text-sm">
                                Automatic categorization: politics, health, science, climate, and more
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <Users size={24} />
                            </div>
                            <h4 className="mb-sm">Community Insights</h4>
                            <p className="text-secondary text-sm">
                                Crowdsourced validation and trending misinformation tracking
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section style={{ background: 'var(--surface)', padding: '4rem 0', borderTop: '1px solid var(--border)' }}>
                <div className="container">
                    <div className="text-center mb-xl">
                        <h2 className="mb-md">How It Works</h2>
                        <p className="text-secondary">Simple, fast, and accurate</p>
                    </div>

                    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                        <div className="grid gap-lg">
                            {[
                                {
                                    num: '01',
                                    title: 'Submit Text',
                                    desc: 'Paste or type the content you want to verify for accuracy',
                                    icon: AlertTriangle
                                },
                                {
                                    num: '02',
                                    title: 'AI Analysis',
                                    desc: 'Advanced Gemini models analyze the text for misinformation signals',
                                    icon: Shield
                                },
                                {
                                    num: '03',
                                    title: 'Get Results',
                                    desc: 'Receive verdict, confidence score, category, and detailed explanation',
                                    icon: TrendingUp
                                },
                                {
                                    num: '04',
                                    title: 'Track Trends',
                                    desc: 'View dashboard analytics and community engagement metrics',
                                    icon: Check
                                },
                            ].map(step => (
                                <div key={step.num} className="card">
                                    <div className="flex gap-lg">
                                        <div style={{
                                            width: '60px',
                                            height: '60px',
                                            background: 'var(--primary)',
                                            color: 'white',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.25rem',
                                            fontWeight: 'bold',
                                            flexShrink: 0
                                        }}>
                                            {step.num}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 className="mb-sm">{step.title}</h4>
                                            <p className="text-secondary text-sm">{step.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section style={{ padding: '4rem 0' }}>
                <div className="container">
                    <div className="card text-center" style={{ maxWidth: '700px', margin: '0 auto', background: 'var(--surface)' }}>
                        <h2 className="mb-md">Ready to get started?</h2>
                        <p className="text-secondary mb-xl" style={{ fontSize: '1.125rem' }}>
                            Browse the global misinformation feed or submit content for fact-checking
                        </p>
                        <div className="flex justify-center gap-md">
                            <button onClick={onBrowseFeed} className="btn btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
                                Browse Feed <TrendingUp size={20} />
                            </button>
                            <button onClick={onGetStarted} className="btn btn-secondary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
                                Fact Check <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '2rem 0', textAlign: 'center' }}>
                <div className="container">
                    <div className="flex items-center justify-center gap-sm mb-sm">
                        <Shield size={20} color="var(--primary)" />
                        <span className="font-semibold">GrandWarden</span>
                    </div>
                    <p className="text-secondary text-sm">
                        © 2026 GrandWarden. AI-Powered Misinformation Detection.
                    </p>
                </div>
            </footer>
        </div>
    );
}
