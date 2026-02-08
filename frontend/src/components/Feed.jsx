import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, TrendingUp, BarChart, Calendar, AlertTriangle, ThumbsUp } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const CATEGORIES = [
    { id: 'all', label: 'All', color: '#6B7280' },
    { id: 'politics', label: 'Politics', color: '#DC2626' },
    { id: 'health', label: 'Health', color: '#059669' },
    { id: 'science', label: 'Science', color: '#2563EB' },
    { id: 'climate', label: 'Climate', color: '#10B981' },
    { id: 'technology', label: 'Technology', color: '#7C3AED' },
    { id: 'finance', label: 'Finance', color: '#F59E0B' },
    { id: 'entertainment', label: 'Entertainment', color: '#EC4899' },
    { id: 'general', label: 'General', color: '#6B7280' }
];

export default function Feed() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [exporting, setExporting] = useState(false);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchFeed();
    }, []);

    const fetchFeed = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/dashboard`);
            setItems(response.data.items || []);
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch feed:', error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUpvote = async (itemId) => {
        try {
            await axios.post(`${API_BASE}/upvote`, { id: itemId });
            setItems(items.map(item =>
                item._id === itemId ? { ...item, upvotes: (item.upvotes || 0) + 1 } : item
            ));
        } catch (error) {
            console.error('Upvote failed:', error);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const response = await axios.get(`${API_BASE}/export`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `grandwarden-report-${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export data');
        } finally {
            setExporting(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const filteredItems = selectedCategory === 'all'
        ? items
        : items.filter(item => item.category === selectedCategory);

    const getCategoryCount = (categoryId) => {
        if (categoryId === 'all') return items.length;
        return items.filter(item => item.category === categoryId).length;
    };

    return (
        <div>
            {/* Stats + Export */}
            <div className="grid grid-4 mb-lg">
                <div className="stat-card">
                    <div className="stat-value">{stats?.totalDetections || 0}</div>
                    <div className="stat-label">Total Detections</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats?.totalUpvotes || 0}</div>
                    <div className="stat-label">Community Upvotes</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{filteredItems.length}</div>
                    <div className="stat-label">Filtered Items</div>
                </div>
                <div className="stat-card">
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                    >
                        <Download size={16} />
                        {exporting ? 'Exporting...' : 'Export CSV'}
                    </button>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="card mb-lg">
                <h3 className="mb-md">Filter by Category</h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                        >
                            <span style={{
                                display: 'inline-block',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: cat.color,
                                marginRight: '0.5rem'
                            }} />
                            {cat.label}
                            <span className="badge badge-review" style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>
                                {getCategoryCount(cat.id)}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Feed List */}
            <div className="card">
                <div className="flex items-center justify-between mb-lg">
                    <div className="flex items-center gap-sm">
                        <BarChart size={24} style={{ color: 'var(--primary)' }} />
                        <h2>Misinformation Feed</h2>
                    </div>
                    <span className="text-sm text-secondary">
                        {filteredItems.length} of {items.length} items
                    </span>
                </div>

                {loading ? (
                    <div className="text-center" style={{ padding: '3rem 0' }}>
                        <div className="spinner" style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid rgba(30, 64, 175, 0.2)',
                            borderTopColor: 'var(--primary)',
                            margin: '0 auto 1rem'
                        }} />
                        <p className="text-secondary">Loading feed...</p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="info-box text-center">
                        <p>No misinformation found in this category.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {filteredItems.map((item) => (
                            <div key={item._id} className="card" style={{ background: 'var(--surface)', margin: 0 }}>
                                <div className="flex items-start justify-between gap-md mb-sm">
                                    <span className="badge badge-declined text-capitalize">
                                        {item.category || 'general'}
                                    </span>
                                    <span className="text-xs text-secondary flex items-center gap-xs">
                                        <Calendar size={12} />
                                        {formatDate(item.timestamp)}
                                    </span>
                                </div>

                                <p className="mb-sm" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
                                    <strong>"{item.text}"</strong>
                                </p>

                                <div className="info-box mb-sm">
                                    <p className="text-sm">{item.explanation}</p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-sm">
                                        <span className="badge badge-review">
                                            <AlertTriangle size={12} />
                                            {Math.round(item.confidence * 100)}% confidence
                                        </span>
                                        {item.variations > 0 && (
                                            <span className="badge badge-info">
                                                {item.variations} variations
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleUpvote(item._id)}
                                        className="btn btn-secondary"
                                        style={{ padding: '6px 12px', fontSize: '0.875rem' }}
                                    >
                                        <ThumbsUp size={14} />
                                        {item.upvotes || 0}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
