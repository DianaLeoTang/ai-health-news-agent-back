"use client"
import React, { useEffect } from 'react';
import { createMachine, assign, interpret } from 'xstate';
import { useMachine } from '@xstate/react';

// 定义文章数据接口
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

// 定义状态机上下文
interface ArticleContext {
  articles: ArticleData[];
  currentPage: number;
  articlesPerPage: number;
  error: string | null;
}

// 定义状态机事件
type ArticleEvent =
  | { type: 'FETCH' }
  | { type: 'RESOLVE'; data: ArticleData[] }
  | { type: 'REJECT'; error: string }
  | { type: 'NEXT_PAGE' }
  | { type: 'PREV_PAGE' }
  | { type: 'GO_TO_PAGE'; page: number };

// 创建文章列表状态机
const articleMachine = createMachine<ArticleContext, ArticleEvent>(
  {
    id: 'articles',
    initial: 'idle',
    context: {
      articles: [],
      currentPage: 1,
      articlesPerPage: 50,
      error: null
    },
    states: {
      idle: {
        on: {
          FETCH: 'loading'
        }
      },
      loading: {
        invoke: {
          src: 'fetchArticles',
          onDone: {
            target: 'success',
            actions: 'setArticles'
          },
          onError: {
            target: 'failure',
            actions: 'setError'
          }
        }
      },
      success: {
        on: {
          NEXT_PAGE: {
            actions: 'goToNextPage'
          },
          PREV_PAGE: {
            actions: 'goToPrevPage'
          },
          GO_TO_PAGE: {
            actions: 'goToSpecificPage'
          },
          FETCH: 'loading'
        }
      },
      failure: {
        on: {
          FETCH: 'loading'
        }
      }
    }
  },
  {
    actions: {
      setArticles: assign({
        articles: (_, event) => {
          if ('data' in event) {
            return event.data;
          }
          return [];
        },
        error: (_) => null
      }),
      setError: assign({
        error: (_, event) => {
          if ('error' in event) {
            return event.error;
          }
          return 'An unknown error occurred';
        }
      }),
      goToNextPage: assign({
        currentPage: (context) => {
          const totalPages = Math.ceil(context.articles.length / context.articlesPerPage);
          return Math.min(context.currentPage + 1, totalPages);
        }
      }),
      goToPrevPage: assign({
        currentPage: (context) => Math.max(context.currentPage - 1, 1)
      }),
      goToSpecificPage: assign({
        currentPage: (context, event) => {
          if ('page' in event) {
            const totalPages = Math.ceil(context.articles.length / context.articlesPerPage);
            return Math.min(Math.max(event.page, 1), totalPages);
          }
          return context.currentPage;
        }
      })
    },
    services: {
      fetchArticles: async () => {
        const response = await fetch('/api/news', {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 格式化 API 返回的数据
        return data.map((item: ArticleData, index: number) => ({
          ...item,
          id: item.id || `article-${index}`
        }));
      }
    }
  }
);

// 创建一个客户端组件包装器
const ClientOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMounted, setIsMounted] = React.useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return null; // 服务器端渲染时返回 null
  }
  
  return <>{children}</>;
};

// 文章列表组件
const ArticleList: React.FC = () => {
  return (
    <div className="max-w-4xl px-4 mx-auto">
      <h2 className="py-3 mb-6 text-xl font-bold border-t border-b border-gray-300">公共卫生热点</h2>
      
      {/* 使用 ClientOnly 组件确保只在客户端渲染 */}
      <ClientOnly>
        <ArticleListContent />
      </ClientOnly>
    </div>
  );
};

// 文章列表内容组件 - 只在客户端渲染
const ArticleListContent: React.FC = () => {
  const [state, send] = useMachine(articleMachine);
  
  const { articles, currentPage, articlesPerPage, error } = state.context;
  
  // 加载数据
  useEffect(() => {
    send({ type: "FETCH" });
  }, [send]);
  
  // 计算当前页的文章
  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = articles.slice(indexOfFirstArticle, indexOfLastArticle);
  const totalPages = Math.ceil(articles.length / articlesPerPage);
  
  // 分页处理函数
  const paginate = (pageNumber: number) => send({ type: 'GO_TO_PAGE', page: pageNumber });
  const goToPrevPage = () => send('PREV_PAGE');
  const goToNextPage = () => send('NEXT_PAGE');
  
  return (
    <>
      {state.matches('loading') ? (
        <div className="p-4 text-center">Loading articles...</div>
      ) : state.matches('failure') ? (
        <div className="p-4 text-center text-red-500">Error loading articles: {error}</div>
      ) : (
        <>
          <div>
            {currentArticles.map(article => (
              <div key={article.id} className="py-6 border-b border-gray-200">
                <h3 className="mb-2 text-xl font-bold">
                  <a
                    href={article.link}
                    className="text-gray-800 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {article.title}
                  </a>
                </h3>
                <p className="leading-relaxed text-gray-600">{article.summary}</p>
                {article.correspondence && (
                  <div className="mt-4 text-sm">
                    <span className="font-semibold">Correspondence</span>
                    <a href="#" className="ml-1 text-blue-600 hover:underline">
                      {article.correspondence}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* 分页控件 */}
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
    </>
  );
};

export default ArticleList;