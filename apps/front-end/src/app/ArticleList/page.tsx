/*
 * @Author: Diana Tang
 * @Date: 2025-03-04 13:31:30
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent/apps/front-end/src/app/ArticleList/page.tsx
 */
"use client"
import React, { useState, useEffect } from 'react';

interface ArticleData {
  title: string;
  link: string;
  summary: string;
  // 添加用于UI显示的额外字段
  id?: string;
  type?: string;
  date?: string;
  category?: string;
  authors?: string;
  correspondence?: string;
}

const ArticleList: React.FC = () => {
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [articlesPerPage] = useState<number>(50);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        // 替换为实际的API端点
        const response = await fetch('/api/news');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        
        // 使用API返回的数据，添加UI需要的其他字段
        const formattedArticles = data.map((item: ArticleData, index: number) => ({
          ...item,
          id: `article-${index}`,
          // type: getRandomArticleType(),
          // date: getRandomRecentDate(),
          category: getRandomCategory(),
          // authors: getRandomAuthors()
        }));
        
        setArticles(formattedArticles);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching articles:', err);
        
        // 使用示例数据作为后备
        setArticles(sampleArticles);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  // 获取当前页的文章
  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = articles.slice(indexOfFirstArticle, indexOfLastArticle);

  // 页面导航
  const totalPages = Math.ceil(articles.length / articlesPerPage);
  
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  // 格式化日期显示
  const formatDate = (dateString: string): string => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const date = new Date(dateString);
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  // 辅助函数，为从API获取的数据生成随机UI元素
  function getRandomArticleType(): string {
    const types = ['REVIEW ARTICLE', 'RESEARCH', 'CASE STUDY', 'HEALTH LAW, ETHICS, AND HUMAN RIGHTS'];
    return types[Math.floor(Math.random() * types.length)];
  }

  function getRandomRecentDate(): string {
    const now = new Date();
    const randomDays = Math.floor(Math.random() * 180); // 最近6个月内
    const date = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  }

  function getRandomCategory(): string {
    const categories = [
      'WEARABLE DIGITAL HEALTH TECHNOLOGIES IN MEDICINE',
      'AI IN MEDICINE',
      'MEDICAL RESEARCH',
      'CLINICAL PRACTICE'
    ];
    return categories[Math.floor(Math.random() * categories.length)];
  }

  function getRandomAuthors(): string {
    const authorSets = [
      'E. Donner, O. Devinsky, and D. Friedman',
      'S. Fedor and Others',
      'M.M. Mello and N. Guha',
      'E.S. Spatz and Others',
      'K. Johnson, L. Wang, and P. Smith'
    ];
    return authorSets[Math.floor(Math.random() * authorSets.length)];
  }

  if (loading) return <div className="p-4 text-center">Loading articles...</div>;
  
  if (error) return <div className="p-4 text-center text-red-500">Error loading articles: {error}</div>;

  return (
    <div className="max-w-4xl mx-auto px-4">
      <h2 className="text-xl font-bold py-3 border-t border-b border-gray-300 mb-6">公共卫生热点</h2>
      
      <div>
        {currentArticles.map(article => (
          <div key={article.id} className="py-6 border-b border-gray-200">
            <div className="flex items-center text-sm mb-1">
              {/* <span className="text-red-600 font-medium">{article.type}</span> */}
              <span className="mx-2 text-gray-400">|</span>
              {/* <span className="text-gray-600">{formatDate(article.date || '')}</span> */}
            </div>
            
            <div className="text-sm text-gray-600 uppercase mb-2">{article.category}</div>
            
            <h3 className="text-xl font-bold mb-2">
              <a href={article.link} className="hover:underline text-gray-800" target="_blank" rel="noopener noreferrer">
                {article.title}
              </a>
            </h3>
            
            {/* <div className="text-gray-700 mb-3">{article.authors}</div> */}
            
            <p className="text-gray-600 leading-relaxed">{article.summary}</p>
            
            {article.correspondence && (
              <div className="mt-4 text-sm">
                <span className="font-semibold">Correspondence</span> 
                <a href="#" className="text-blue-600 ml-1 hover:underline">{article.correspondence}</a>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center my-8">
          <button 
            onClick={goToPrevPage} 
            disabled={currentPage === 1}
            className="px-4 py-2 mx-1 border rounded disabled:opacity-50 text-sm"
          >
            Previous
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNumber;
            if (totalPages <= 5) {
              pageNumber = i + 1;
            } else if (currentPage <= 3) {
              pageNumber = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNumber = totalPages - 4 + i;
            } else {
              pageNumber = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNumber}
                onClick={() => paginate(pageNumber)}
                className={`px-4 py-2 mx-1 border rounded text-sm ${
                  currentPage === pageNumber ? 'bg-gray-100 font-medium' : ''
                }`}
              >
                {pageNumber}
              </button>
            );
          })}
          
          <button 
            onClick={goToNextPage} 
            disabled={currentPage === totalPages}
            className="px-4 py-2 mx-1 border rounded disabled:opacity-50 text-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

// 使用你提供的数据格式作为示例
const sampleArticles: ArticleData[] = [
  {
    id: '1',
    title: "H5N1 from an infected dairy worker sheds light on viral transmission",
    link: "https://www.nature.com/articles/d41591-024-00078-2",
    summary: "Two studies reveal high transmissibility and lethality of the viral isolate in animal models, and hint at potential drug susceptibility — but further analysis and ongoing surveillance of infections will be critical for public health.",
    category: 'MEDICAL RESEARCH'
  },
  {
    id: '2',
    title: "Exploring the limits of life extension",
    link: "https://www.nature.com/articles/d41591-024-00076-4",
    summary: "The twentieth century saw unprecedented rises in life expectancy in high-income countries, but data suggest that this trend will not continue in the current century without radical interventions to slow biological aging.",
    category: 'MEDICAL RESEARCH'
  },
  {
    id: '3',
    category: 'WEARABLE DIGITAL HEALTH TECHNOLOGIES IN MEDICINE',
    title: 'Wearable Digital Health Technologies for Epilepsy',
    link: '#',
    summary: 'One third of people with epilepsy have seizures despite medical treatment. The authors examine wearable digital health devices that can detect seizures and how these devices can affect epilepsy care.'
  },
  {
    id: '4',
    category: 'WEARABLE DIGITAL HEALTH TECHNOLOGIES IN MEDICINE',
    title: 'Wearable Technologies in Cardiovascular Medicine',
    link: '#',
    summary: 'This article reviews the use of digital wearable technologies for monitoring of three common cardiovascular conditions: hypertension, heart failure, and atrial fibrillation.'
  }
];

export default ArticleList;