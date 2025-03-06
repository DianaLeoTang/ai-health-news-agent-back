import { Project } from 'ts-morph';

// 创建新的项目实例
const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

// 设置原始路径和新路径
const oldPath = 'src/services/someFile.ts'; // 修改为源文件相对路径
const newPath = 'src/utils/someFile.ts';    // 修改为目标文件相对路径

// 获取所有源文件
const sourceFiles = project.getSourceFiles();

// 更新从旧路径到新路径的所有导入
sourceFiles.forEach(sourceFile => {
  const importDeclarations = sourceFile.getImportDeclarations();
  
  importDeclarations.forEach(importDecl => {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();
    
    // 检查是否导入了旧路径中的文件
    if (moduleSpecifier.includes(oldPath) || 
        moduleSpecifier.endsWith(oldPath.replace('src/', '')) ||
        moduleSpecifier.endsWith(oldPath.replace('src/', '').replace('.ts', ''))) {
      
      // 计算新的导入路径（需要考虑相对路径的差异）
      const newModuleSpecifier = moduleSpecifier.replace(
        oldPath.replace('src/', '').replace('.ts', ''),
        newPath.replace('src/', '').replace('.ts', '')
      );
      
      // 更新导入声明
      importDecl.setModuleSpecifier(newModuleSpecifier);
      console.log(`在 ${sourceFile.getFilePath()} 中更新了导入: ${moduleSpecifier} -> ${newModuleSpecifier}`);
    }
  });
});

// 保存所有更改
project.saveSync();
console.log('所有导入路径已更新!');