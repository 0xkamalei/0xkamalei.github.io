---
title: "云服务成本治理成熟度"
date: 2022-07-02
slug: cloud-service-cost-maturity
tags: ['云原生', '内部分享', '技术']
draft: false
---


昨天和王凯huddle他提到现在这个时候团队都想着怎么省钱减少IT支出


既然应征了频主，应景拉一个话题 EP1：**云服务怎么用更省钱？**


在抛我的观点之前先统计一下大家对成本的感觉，可以用reaction投票


:one: 成本是老板的事，从不关心成本就是干


:two: IT成本是运维的事，不应该开发关注


:three: 会有一些考虑但不经常关心，coding没多少和成本相关的东西


:four: 穷人思维（抠逼）驱动设计，啥都想到成本


:five: 我有特殊的省钱技巧


云服务的一大特点就是按量付费，但是前提时得正确的姿势使用，不然可能不能帮你省钱，还可能直接干破产，有兴趣的可以八卦一下这个案例[《Milkie Way公司破产未遂事件》](https://zhuanlan.zhihu.com/p/358250097)，原视频找不到了，我记得好像是这个公司有创始人是Google出来的，事件在网上造成了一定的传播度，后来申诉通过Google把账单退了，要是普通人可没这么好运。


我觉得成本治理成熟度大概是分5步


熟悉云产品收费策略，收费方式，知道


能够选择适合自己业务场景的收费策略，会用


有成本治理工具，用好


低成本的产品/架构设计


低成本编码思维灌注到每个团队成员中，组织文化层面


1 了解收费策略，收费方式


现在的收费策略真的太多了，按量付费，包年包月，按API使用量付费，固定带宽付费，固定流量付费，日峰值带宽计费，月95峰值带宽计费，四日峰值带宽计费，。。。。


稍微聊两个我认为特别创新有意思的收费方式大家感受一下


**四日峰值带宽计费**：每5分钟取一个数值，每天288个值，取其最大值为 “日峰值“，第四日峰值表示在当月或者选择日期内的降序第4个“日峰值“带宽，如果选择天数小于4天，则表示最小日峰值带宽。


适用场景：每月带宽曲线会有1-2天突发的情况，例如618、双十一等活动当天。和95峰值思路类似剔除掉聊最高的流量峰值，如果平时流量水平一直很低就比较省钱聊。


[突增型性能实例](https://docs.aws.amazon.com/zh_cn/AWSEC2/latest/UserGuide/burstable-performance-instances.html)：平时不繁忙的时候积分，再需要突破性能的时候消耗积分达到上限，适用于定时跑批的任务，比如购买4vcpu8G再没积分的情况下可能只能使用20%的容量，有积分的情况下能冲刺到全量。


更多一手知识来源官方文档[AWS](https://aws.amazon.com/cn/pricing/)，[datadog](https://www.datadoghq.com/pricing/)

1. 选择适合自己业务场景的收费策略

举个例子，[S3的存储类型](https://docs.aws.amazon.com/zh_cn/AmazonS3/latest/userguide/storage-class-intro.html)是特别多的，多数默认用standard，考量一下你的业务真的需要是standard吗？比如导出上一年的账单备份，可能一两年内也不会load出来一次，就可以考虑用冷存储。


还有就是按量付费还是预置容量，比如[lambda](https://docs.aws.amazon.com/zh_cn/lambda/latest/dg/provisioned-concurrency.html)，[dynamodb](https://docs.aws.amazon.com/zh_cn/amazondynamodb/latest/developerguide/ProvisionedThroughput.html)，都有类似的配置，预置容量会产生一定费用，但是也有好处，万一大量请求打过来，自动扩容会有一定的延迟，不至于打个措手不及，也不存在冷启动的问题，看似按量付费很安好，但是有个大炕在没法设置上限的情况下都不推荐使用按量付费，要不然就会就先开头案例的悲剧，搞不好有个压力测试过来，海量的弹性=>海量的钱，直接:sob:就


3 成本治理


为什么需要成本治理？因为资源太多了计费太复杂人管不过来，比如team创建了一个resource用来做测试的，后来再也没用过，然后就一直闲置在哪里消耗你的钱


所以治理一般都是通过监控API探测是否闲置，是否利用率低可将配，是否付费方式可调整，等等有一系列和成本相关的规则。


基本上每个云厂都会有一个**Advisor的云服务（毕竟都是抄AWS），里面有一个部分就是做成本管理，比如AWS的[trusted-advisor](https://aws.amazon.com/cn/premiumsupport/technology/trusted-advisor/) 另外还有一个做的特别好的也是各厂借鉴的对象[Morpheus](https://morpheusdata.com/hybrid-cloud-management/cost-optimization-finops/),不要误会这个厂是做云资源管理的cost manage只是其中一个功能，在[garter上排名](https://www.gartner.com/reviews/market/cloud-management-tooling)还挺高第二；可见现在云治理的复杂度，AWS管你的基础设施，还得再找个人帮你管AWS上的资源。。。:sweat_smile:


4.低成本的产品/架构


之前看过一个QQ空间团队分享过一个概念（原视频找不到了）， 单客户IT成本=服务客户数/服务器数 以前主要是硬件服务器，现在更多的是云服务，可能现在 单客户IT成本=服务客户数/IT资源成本。


很简单就是以前需要100台机器搞定的事，现在用好的技术/架构 10台就能搞定。


还有就是如果是没什么人用低流量不重要的服务，难道你要买一个4核8G的Mysql+1G redis配套吗，直接一个sqlite不香吗，大概就是这个意思。


5.低成本编程思维


API能一次查询搞定就不两次，精简log输出（不让collect上去都要为storage付费），更好性能能低硬件需求。。。。。还有哪些大家来补充吧。。

