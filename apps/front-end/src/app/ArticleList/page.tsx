"use client"
import React, { Suspense, useState, useEffect } from 'react';

interface ArticleData {
  title: string;
  link: string;
  summary: string;
  id?: string;
  type?: string;
  date?: string;
  category?: string;
  authors?: string;
  correspondence?: string;
}

// Loading component
const ArticleListSkeleton = () => {
  return (
    <div className="max-w-4xl px-4 mx-auto">
      <h2 className="py-3 mb-6 text-xl font-bold border-t border-b border-gray-300">公共卫生热点</h2>
      <div className="p-4 text-center">Loading articles...</div>
    </div>
  );
};

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode, fallback: React.ReactNode },
  { hasError: boolean, error: Error | null }
> {
  constructor(props: { children: React.ReactNode, fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return typeof this.props.fallback === 'function' 
        ? this.props.fallback(this.state.error) 
        : this.props.fallback;
    }
    return this.props.children;
  }
}

// Error fallback component
const ErrorFallback = ({ error }: { error: Error | null }) => (
  <div className="max-w-4xl px-4 mx-auto">
    <h2 className="py-3 mb-6 text-xl font-bold border-t border-b border-gray-300">公共卫生热点</h2>
    <div className="p-4 text-center text-red-500">
      Error loading articles: {error ? error.message : 'Unknown error'}
    </div>
  </div>
);

// Main component that fetches data
const ArticleListContent = () => {
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [articlesPerPage] = useState<number>(50);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        // 替换为实际的API端点
        const response = await fetch('/api/news', {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 使用API返回的数据，添加UI需要的其他字段
        const formattedArticles = data.map((item: ArticleData, index: number) => ({
          ...item,
          id: `article-${index}`,
        }));
        
        setArticles(formattedArticles);
      } catch (err: any) {
        setError(err instanceof Error ? err : new Error(err.message || 'Unknown error'));
        console.error('Error fetching articles:', err);
      } finally {
        setIsLoading(false);
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

  if (error) {
    throw error;
  }

  if (isLoading) {
    return <ArticleListSkeleton />;
  }

  return (
    <div className="max-w-4xl px-4 mx-auto">
      <h2 className="py-3 mb-6 text-xl font-bold border-t border-b border-gray-300">公共卫生热点</h2>
      
      {articles.length === 0 ? (
        <div className="p-4 text-center">No articles found.</div>
      ) : (
        <>
          <div>
            {currentArticles.map(article => (
              <div key={article.id} className="py-6 border-b border-gray-200">
                <h3 className="mb-2 text-xl font-bold">
                  <a href={article.link} className="text-gray-800 hover:underline" target="_blank" rel="noopener noreferrer">
                    {article.title}
                  </a>
                </h3>
                
                <p className="leading-relaxed text-gray-600">{article.summary}</p>
                
                {article.correspondence && (
                  <div className="mt-4 text-sm">
                    <span className="font-semibold">Correspondence</span> 
                    <a href="#" className="ml-1 text-blue-600 hover:underline">{article.correspondence}</a>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center my-8">
              <button 
                onClick={goToPrevPage} 
                disabled={currentPage === 1}
                className="px-4 py-2 mx-1 text-sm border rounded disabled:opacity-50"
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
                className="px-4 py-2 mx-1 text-sm border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Main component with ErrorBoundary
const ArticleList: React.FC = () => {
  return (
    <ErrorBoundary fallback={<ErrorFallback error={null} />}>
      <ArticleListContent />
    </ErrorBoundary>
  );
};

export default ArticleList;