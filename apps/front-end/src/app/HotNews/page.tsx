
'use client';

import React, { useState, useEffect } from 'react';

const HotNews = () => {
  const [news, setNews] = useState([]);
  const [activeTab, setActiveTab] = useState('热搜');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        console.log('开始请求新闻数据...');
        
        // 使用相对路径通过API路由获取数据
        const response = await fetch('/api/news');
        
        if (!response.ok) {
          throw new Error(`HTTP错误! 状态: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('获取到的数据:', data);
        
        setNews(data);
      } catch (error) {
        console.error('获取新闻错误:', error);
        // 出错时使用后备数据
        setNews(getFallbackData());
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const tabs = ['公共卫生热点'];

  return (
    <div className="hot-news-container">
      {/* Tabs */}
      <div className="tabs">
        {tabs?.map((tab) => (
          <div
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* News List */}
      <div className="news-list">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          news.map((item, index) => (
            <a
              key={index}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="news-item"
            >
              <div className="news-rank">{index + 1}</div>
              <div className="news-title">{item.title}</div>
              {item.summary && item.summary !== "No summary available" && (
                <div className="news-badge">
                  {item.summary.includes('|') 
                    ? item.summary.split('|')[0].trim() 
                    : item.summary}
                </div>
              )}
            </a>
          ))
        )}
      </div>
      
      <style jsx>{`
        .hot-news-container {
          width: 1200px;
          border: 1px solid #eee;
          border-radius: 8px;
          overflow: hidden;
          font-family: Arial, sans-serif;
        }
        
        .tabs {
          display: flex;
          border-bottom: 1px solid #eee;
        }
        
        .tab {
          padding: 12px 15px;
          cursor: pointer;
          font-size: 14px;
          flex: 1;
          text-align: center;
        }
        
        .tab.active {
          border-bottom: 2px solid #3388ff;
          color: #3388ff;
          font-weight: bold;
        }
        
        .news-list {
          padding: 8px 16px;
        }
        
        .news-item {
          display: flex;
          align-items: baseline;
          padding: 8px 0;
          text-decoration: none;
          color: #333;
          border-bottom: 1px solid #f5f5f5;
        }
        
        .news-rank {
          min-width: 20px;
          font-size: 14px;
          color: #ff4d4f;
          font-weight: bold;
          margin-right: 8px;
        }
        
        .news-title {
          flex: 1;
          font-size: 14px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .news-badge {
          margin-left: 8px;
          padding: 2px 4px;
          background: #ff4d4f;
          color: white;
          border-radius: 4px;
          font-size: 12px;
        }
        
        .loading {
          padding: 20px;
          text-align: center;
          color: #999;
        }
      `}</style>
    </div>
  );
};

export default HotNews;