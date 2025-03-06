/*
 * @Author: Diana Tang
 * @Date: 2025-03-07 03:31:34
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent-Back/src/services/getAllNews copy.ts
 */
/**
 * 并发请求医学新闻源的最优解
 * 特点：
 * 1. 使用Promise.all进行并发请求
 * 2. 添加超时控制避免长时间阻塞
 * 3. 错误处理确保单个请求失败不影响整体
 * 4. 可配置的并发限制防止过多请求
 */

const NEWS_SOURCES = [
  'https://jamanetwork.com/',
  'https://jamanetwork.com/journals/jama-health-forum',
  'https://jamanetwork.com/journals/jama',
  'https://www.nejm.org/equity',
  'https://www.nejm.org/browse/specialty/climate-change',
  'https://www.nejm.org/ai-in-medicine',
  'https://www.who.int/news-room/headlines',
  'https://www.bmj.com/',
  'https://www.bmj.com/news/news',
  'https://www.annualreviews.org/content/journals/soc',
  'https://www.annualreviews.org/content/journals/publhealth',
  'https://www.annualreviews.org/content/journals/nutr',
  'https://www.nature.com/collections/ggahieiica',
  'https://www.nature.com/nm/articles?type=research-highlight',
  'https://www.cdc.gov/media/site.html',
  'https://www.nature.com/subjects/health-sciences/nature',
  'https://news.un.org/en/news/topic/health',
  'https://www.thelancet.com/journals/lanpub/home',
  'https://www.who.int/news-room',
  'https://news.un.org/en/news/topic/women'
];

/**
 * 为单个请求创建一个带超时的Promise
 * @param {string} url - 要请求的URL
 * @param {number} timeout - 超时时间(毫秒)
 * @returns {Promise} 包含响应或错误的Promise
 */
function fetchWithTimeout(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error(`Request timeout for ${url}`));
    }, timeout);

    fetch(url, { signal: controller.signal })
      .then(response => {
        clearTimeout(timeoutId);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text(); // 或者 .json()，取决于API返回格式
      })
      .then(data => {
        resolve({ url, data, status: 'success' });
      })
      .catch(error => {
        clearTimeout(timeoutId);
        // 不抛出错误，而是返回一个带错误信息的对象
        resolve({ url, error: error.message, status: 'error' });
      });
  });
}

/**
 * 批量并发请求，带并发控制
 * @param {Array<string>} urls - URL数组
 * @param {number} concurrentLimit - 并发限制数
 * @param {number} timeout - 每个请求的超时时间
 * @returns {Promise<Array>} 所有请求结果的Promise
 */
function batchFetchWithConcurrencyLimit(urls, concurrentLimit = 5, timeout = 10000) {
  // 克隆URL数组，不修改原数组
  const urlsToProcess = [...urls];
  const results = [];
  let activePromises = 0;
  
  // 创建一个Promise，在所有请求完成时解析
  return new Promise((resolve) => {
    // 启动尽可能多的初始请求（不超过并发限制）
    function startFetching() {
      // 当队列中还有URL且未达到并发限制时继续
      while (urlsToProcess.length > 0 && activePromises < concurrentLimit) {
        const url = urlsToProcess.shift();
        activePromises++;
        
        // 发起请求
        fetchWithTimeout(url, timeout)
          .then(result => {
            results.push(result);
            activePromises--;
            
            // 当一个请求完成后，尝试启动更多请求
            startFetching();
            
            // 如果所有请求都已完成，解析最终Promise
            if (activePromises === 0 && urlsToProcess.length === 0) {
              resolve(results);
            }
          });
      }
    }
    
    // 启动初始批次的请求
    startFetching();
    
    // 如果URL数组为空，立即解析
    if (urls.length === 0) {
      resolve([]);
    }
  });
}

/**
 * 主函数：使用最优方案请求所有新闻源
 * @returns {Promise<Array>} 所有请求结果的Promise
 */
async function fetchAllNewsSources() {
  try {
    console.time('fetchAllNewsSources');
    
    // 根据实际网络情况和服务器容量调整并发数
    const results = await batchFetchWithConcurrencyLimit(NEWS_SOURCES, 5);
    
    // 统计成功和失败的请求
    const successful = results.filter(result => result.status === 'success').length;
    const failed = results.filter(result => result.status === 'error').length;
    
    console.log(`请求完成：${successful}个成功，${failed}个失败`);
    console.timeEnd('fetchAllNewsSources');
    
    return results;
  } catch (error) {
    console.error('请求过程中发生错误:', error);
    throw error;
  }
}

// 使用示例
fetchAllNewsSources()
  .then(results => {
    // 处理成功的结果
    const successfulResults = results.filter(result => result.status === 'success');
    console.log(`成功获取了${successfulResults.length}个新闻源的数据`);
    
    // 这里可以添加进一步的数据处理逻辑
    // 例如：解析HTML、提取新闻标题等
  })
  .catch(error => {
    console.error('获取新闻源失败:', error);
  });