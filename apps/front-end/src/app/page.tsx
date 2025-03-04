/*
 * @Author: Diana Tang
 * @Date: 2025-03-03 16:23:21
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent/apps/front-end/src/app/page.tsx
 */
// import HotNews from './HotNews/page.tsx'
import ArticleList from './ArticleList/page'
export default function Index() {
  /*
   * Replace the elements below with your own.
   *
   * Note: The corresponding styles are in the ./index.tailwind file.
   */
  return (
    <div>
      <div className="wrapper">
        <div className="container">
          {/* <HotNews /> */}
          <ArticleList/>
        </div>
      </div>
    </div>
  );
}
