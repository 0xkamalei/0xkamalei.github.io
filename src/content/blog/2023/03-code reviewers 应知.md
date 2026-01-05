---
title: "code reviewers 应知"
date: 2023-05-08T23:47:14+08:00
draft: false
categories: ['职场']
tags: ['coding','agile','code review','敏捷']
slug: "code-reviewers-need-to-know"
---

1. 熟悉github pull request 工具
2. review by checklist.
   1. 是否正确实现了目标
   2. 测试覆盖度
   3. 是否合理的重用
   4. 是否符合最佳实践
   5. 是否符合语言习惯
   6. 代码结构，可读性
   7. 是否满足非功能性需求，性能、安全
3. 给予详细的反馈 **explain why**：code reviewer 的工作不仅仅是找错，还包括指导和指出潜在的问题。尽量给出完整的反馈，包括具体的错误细节和改进建议。
4. 保持专业的态度：永远遵循公司的准则和文化，避免在审核代码时挑剔或过于苛求。避免因审核过程而产生争端或不必要的冲突，保持专业和理智的态度。
   1. **Focusing on coding standards, not personal preference**
   2. 给comment设优先级,Nit,optional,FYI
   3. 明确的approve or request changes after the review done.
5. 对于代码实现好的部分，要不吝啬赞美和夸奖

 

## 附件 📎

[CodeReviewComments](https://github.com/golang/go/wiki/CodeReviewComments) 

[Go Style](https://google.github.io/styleguide/go/) 

[Go Proverbs](https://go-proverbs.github.io/) 



