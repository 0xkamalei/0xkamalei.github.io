---
title: Kafka 与操作系统
date: 2022-12-12 12:00:00
categories: ['技术']
tags: ["Kafka","操作系统"]
slug: kafka-and-os
---



Kafka 能够有良好的 [Efficiency](https://kafka.apache.org/documentation/#maximizingefficiency) （高吞吐量，低延迟），除了和它的架构设计有关还离不了现代操作系统的进步。可以说是站在巨人的肩膀上。

其中两个核心技术是：zero copy 和 multiplexing（IO多路复用）。分享两篇以操作系统演化的视角讲解这两项技术的文章,希望对你深入理解kafka有帮助。



操作系统-零拷贝技术演进

https://colobu.com/2022/11/19/zero-copy-and-how-to-use-it-in-go/  by 鸟窝 

以Java视角看零拷贝技术

https://pdai.tech/md/java/io/java-io-nio-zerocopy.html 



操作系统-网络 IO 演变过程

https://zhuanlan.zhihu.com/p/353692786  by 腾讯技术工程



因为现在kafka并不支持SSL_sendfile，所以当broker开启 SSL加密，将享受不到sendfile带来的收益，因为必定要copy 数据到用户空间进行SSL加密。

另外在写 log.index 文件的时候仍然用到的是mmap技术。

sendfile应该是用在consumer过程中，写append日志的时候不确定有没有用到，文档[4.2 Persistence](https://kafka.apache.org/documentation/#persistence)没有明显提到，有兴趣的可以扒拉一下源码。

