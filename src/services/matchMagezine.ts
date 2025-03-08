// 新的杂志数据格式
interface MagazineInfo {
    title: string;
    url: string;
  }
  
  // 将NEWS_OFFICE格式转换为更易用的映射
  function createMagazineUrlMap(newsOffice: MagazineInfo[]) {
    // 创建URL到杂志名称的映射
    const urlToMagazine = new Map<string, string>();
    // 创建域名到杂志名称的映射（作为备用）
    const domainToMagazine = new Map<string, string>();
    
    // 遍历所有杂志记录
    for (const item of newsOffice) {
      const { title, url } = item;
      
      if (!title || !url) continue;
      
      // 存储完整URL到杂志名称的映射
      urlToMagazine.set(url, title);
      
      try {
        // 提取域名并存储映射
        const hostname = new URL(url).hostname;
        domainToMagazine.set(hostname, title);
        
        // 存储不带www的域名版本
        if (hostname.startsWith('www.')) {
          domainToMagazine.set(hostname.replace('www.', ''), title);
        }
      } catch (error) {
        console.warn(`无法解析URL: ${url}`);
      }
    }
    
    return { urlToMagazine, domainToMagazine };
  }
  
  /**
   * 根据URL获取杂志名称，只使用预定义的映射
   * @param url - 请求的URL
   * @param urlToMagazine - URL到杂志名称的映射
   * @param domainToMagazine - 域名到杂志名称的映射
   * @returns 杂志名称
   */
  function getMagazineTitle(url: string, urlToMagazine: Map<string, string>, domainToMagazine: Map<string, string>): string {
    // 首先尝试完全匹配URL
    for (const [magazineUrl, name] of urlToMagazine.entries()) {
      if (url === magazineUrl || url.startsWith(magazineUrl)) {
        return name;
      }
    }
    
    try {
      // 如果没有完全匹配，尝试匹配域名
      const hostname = new URL(url).hostname;
      
      // 尝试直接匹配域名
      if (domainToMagazine.has(hostname)) {
        return domainToMagazine.get(hostname)!;
      }
      
      // 尝试匹配不带www的域名
      const domainWithoutWww = hostname.replace(/^www\./, '');
      if (domainToMagazine.has(domainWithoutWww)) {
        return domainToMagazine.get(domainWithoutWww)!;
      }
      
      // 尝试部分匹配域名
      for (const [domain, name] of domainToMagazine.entries()) {
        if (hostname.includes(domain) || domain.includes(hostname)) {
          return name;
        }
      }
      
      // 如果没有找到匹配，返回域名
      return hostname;
    } catch (error) {
      // 如果URL解析失败，返回默认值
      return 'Unknown Source';
    }
  }