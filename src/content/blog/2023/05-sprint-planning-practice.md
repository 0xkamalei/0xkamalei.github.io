---
title: "sprint planning 实践思考"
date: 2023-07-06
slug: sprint-planning-practice
tags: ['agile', '敏捷', '职场']
draft: false
---


关于为什么要进行 Planning 估点，在之前分享的一篇[《敏捷实践的建议》](https://leilog.io/posts/2023/discussion-on-agile/)中也提到过。这里再做一次总结。


Planning 的目标是选择 ROI 最高的 backlog，充分沟通降低开发阶段的风险。


**Planning 需要做什么？**


首先，需要选择 Sprint 要完成的卡片。其次，需要确定 Sprint 的工作范围。然后，给所有卡片进行估点，通过每个 Sprint 完成的点数来了解团队的工作量，从而更好地进行后续的 Sprint Planning，甚至是整个产品线的规划。


**Planning 不应该做什么？**


首先，Planning 不是需求评审会。Backlog 中的任务卡片应该描述清晰（Description），完成定义明确（DoD），背景（Background）和需要做的事情（Action）清晰无误。


其次，Planning 不是任务分派会。Planning 的重点不在于分派任务，任务会放到 backlog 中，由团队成员自主选择执行。成员可以在 Planning 的时候主动认领任务。


**接下来，以一个案例来说明我们执行 Planning 的过程。**

1. 每个 Sprint 都有 1 到 3 个目标，根据 Sprint 目标，一般由 PM/EM/Tech Leader 起草 Planning。Devs 根据 Sprint 目标也可以参与起草 Planning。
2. 我们会用到一个异步估点工具 [Async Poker](https://marketplace.atlassian.com/apps/1221281/async-poker-remote-planning-estimation?tab=overview&hosting=cloud)。PM 将添加了 backlog 任务卡的 Async Poker 链接发送给团队成员。
3. 团队成员进入链接，查看每一个任务的描述，根据估点标准给每个卡片进行估点。估点过程中可以对任务卡片留言评论，例如提出疑问或者需要补充、共享的信息。

一般来说，没有固定的估点标准，每个团队可能都不一样。针对 BUG 卡片是否需要估点也存在争议。

1. 之后，在固定的时间召开 Planning 视频会议。
2. 主持人开始 Planning Game 后，针对每一个卡片查看团队成员的估点数。鼓励估点数最大的和最小的成员发言，尽量在这个时候达成一致，以避免团队成员对需求的理解存在差异。注意控制每个卡片的讨论时间，避免陷入实现方案细节讨论中。

   这个环节才是最核心最重要的，交流讨论， [Creates a Shared Understanding](https://doasync.com/blog/2023-how-to-estimate-product-backlog-items-in-scrum/)， Identifies Bottlenecks and Dependencies...

1. 之后，主持人设置一个取得一致性意见的估点数。如果意见无法达成一致，可以设置成成员估点中的最大点数。
2. 最后，完成 Planning Game，Async Poker 会批量更新每个 ticket 的估点数。

关于估点的更多实施细节可以参考 Async Poker 插件的[官方博客](https://doasync.com/blog/)。

