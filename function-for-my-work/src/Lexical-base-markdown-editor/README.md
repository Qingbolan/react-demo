# Lexical Base Markdown Editor - 标题插件

本编辑器现在包含一个专门的**TitlePlugin**，提供了强大的一级标题功能，包括占位文本、默认标题和删除保护。

## 🚀 新架构

### TitlePlugin
专门的插件来处理所有标题相关功能：
- ✅ 智能占位文本
- ✅ 默认标题初始化  
- ✅ 删除保护机制
- ✅ 实时DOM更新

### TitleExample
功能性演示组件，展示不同的标题配置：
- 🎮 4种预设配置
- 🔄 实时切换
- 📊 功能展示
- 💡 使用指南

## 🎯 核心功能

### 1. 智能占位文本
```css
/* 自动适配H1样式的半透明占位文本 */
.editor-input h1:empty::before {
    content: attr(data-placeholder);
    opacity: 0.4;
    background: linear-gradient(to right, #41B883, #3490DC, #6574CD);
    /* 更多样式... */
}
```

### 2. 默认标题功能
```jsx
// 当hasDefaultTitle=true时，自动创建H1标题
<LexicalWysiwygEditor 
  hasDefaultTitle={true}
  titlePlaceholder="请输入标题..."
/>
```

### 3. 删除保护
- 🛡️ 防止删除第一个H1标题
- ⌨️ 拦截Backspace和Delete键
- 🔒 仅在启用默认标题时生效

### 4. 标题空格防护 ✨ NEW
- 🚫 防止所有等级标题（H1-H6）以空格开头
- ⌨️ 自动拦截空格键按压
- 📋 自动处理粘贴内容，移除前导空格
- 🔤 保留标题中间和末尾的空格
- 🎯 适用于所有标题创建方式（markdown语法、快捷键等）

## 📦 使用方法

### 基本导入
```jsx
import LexicalWysiwygEditor, { TitlePlugin, TitleExample } from './Lexical-base-markdown-editor';
```

### 编辑器配置
```jsx
// 基本编辑器
<LexicalWysiwygEditor />

// 带保护标题的编辑器
<LexicalWysiwygEditor hasDefaultTitle={true} />

// 自定义占位文本
<LexicalWysiwygEditor 
  hasDefaultTitle={true}
  titlePlaceholder="输入您的文档标题..."
/>
```

### 独立使用TitlePlugin
```jsx
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { TitlePlugin } from './Lexical-base-markdown-editor';

<LexicalComposer initialConfig={config}>
  <TitlePlugin 
    hasDefaultTitle={true}
    titlePlaceholder="自定义占位文本"
  />
  {/* 其他插件... */}
</LexicalComposer>
```

### 演示组件
```jsx
// 标题功能演示
import { TitleExample } from './Lexical-base-markdown-editor';

// 标题空格防护测试
import { TitleSpacePreventionTest } from './Lexical-base-markdown-editor';

<TitleExample />
<TitleSpacePreventionTest />
```

## ⚙️ 参数说明

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `hasDefaultTitle` | boolean | false | 是否自动创建默认H1标题并保护 |
| `titlePlaceholder` | string | "Enter your title..." | H1标题的占位文本内容 |

## 🎨 样式系统

### 占位文本样式
- **渐变色彩**：与H1标题完全一致的渐变
- **透明度**：0.35-0.4，确保可见性
- **字体**：继承H1的所有字体属性
- **响应式**：自动适配深色/浅色主题

### CSS自定义属性
```css
/* 支持CSS变量 */
h1 {
  --placeholder-text: "你的自定义占位文本";
}
```

## 🧪 测试验证

### 功能测试
1. **占位文本显示**：空H1是否显示占位文本
2. **删除保护**：默认标题是否无法删除
3. **样式一致性**：占位文本是否与H1样式匹配
4. **动态更新**：占位文本是否随props更新

### 测试组件
```jsx
import { Test } from './Lexical-base-markdown-editor';
<Test /> // 运行所有测试用例
```

## 📋 预设配置

### 1. 博客编辑器
```jsx
<LexicalWysiwygEditor 
  hasDefaultTitle={true}
  titlePlaceholder="What's your story about?"
/>
```

### 2. 文档编辑器  
```jsx
<LexicalWysiwygEditor 
  hasDefaultTitle={true}
  titlePlaceholder="Document Title - Required"
/>
```

### 3. 自由编辑器
```jsx
<LexicalWysiwygEditor 
  hasDefaultTitle={false}
  titlePlaceholder="Add a title if you want..."
/>
```

## 🔧 技术实现

### 插件架构
- **模块化设计**：TitlePlugin独立处理标题功能
- **事件驱动**：基于Lexical命令系统
- **DOM操作**：MutationObserver监听变化
- **生命周期**：useEffect管理插件状态

### 核心算法
```jsx
// 删除保护逻辑
const preventDeletion = editor.registerCommand(
  KEY_BACKSPACE_COMMAND,
  (event) => {
    // 检测是否尝试删除第一个H1
    // 返回true阻止删除
  },
  COMMAND_PRIORITY_HIGH
);
```

## 🐛 故障排除

### 常见问题
1. **占位文本不显示**：检查CSS加载和H1是否为空
2. **删除保护失效**：确认hasDefaultTitle=true
3. **样式不一致**：验证CSS优先级和继承

### 调试工具
```jsx
// 在浏览器控制台检查
document.querySelectorAll('h1[data-placeholder]')
```

## 📈 性能优化

- **DOM缓存**：减少重复查询
- **事件节流**：防止过度更新
- **选择器优化**：精确的CSS选择器
- **内存管理**：正确清理事件监听器

## 🚀 未来计划

- [ ] 支持更多标题级别（H2-H6）
- [ ] 国际化占位文本
- [ ] 自定义样式主题
- [ ] 标题模板系统
- [ ] 实时协作支持

## 📚 相关文档

- [Lexical文档](https://lexical.dev/)
- [插件开发指南](https://lexical.dev/docs/concepts/plugins)
- [CSS渐变指南](https://developer.mozilla.org/en-US/docs/Web/CSS/gradient)

## TitlePlugin Debug & Fixes 🔧

### Issues Fixed

The TitlePlugin had several problems that have been resolved:

#### 1. **Complex DOM Manipulation**
- **Problem**: Direct DOM queries with `querySelectorAll('h1')` and `MutationObserver`
- **Solution**: Use Lexical's `editor.getElementByKey()` API for proper DOM access

#### 2. **Performance Issues**
- **Problem**: `MutationObserver` with multiple `setTimeout`