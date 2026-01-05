---
title: 云原生第九条要素与 Kafka
date: 2022-11-11 11:30:00
categories: ['技术']
tags: ['go','云原生','kafka']
slug: 12-factor-nine-with-kafka
---



第九条 Disposability https://12factor.net/disposability

Maximize robustness with fast startup and graceful shutdown

高度抽象的知识是有害的，这条规则可以拆开三句话来理解。

1. 进程应该极力追求最小的启动时间
2. 进程应该响应中止信号(SIGTERM)优雅退出
3. 进程应该能够在被强杀（SIGKILL）是保持健壮性，比如业务数据一致
4. 进程异常退出未做处理等同于被强杀
   1. go 例子 panic 未recover
   2. java 例子 未捕获的异常同时也没配置JVM shutdown hook

这里的背景知识：

* 是程序是运行在云基础设施的可以理解是k8s,一个pod可能随时因为底层的原因被kill掉，然后在新的node上重建，控制器是保证了replication数量，整体是可用的，但是单个pod是随时生生死死。

* [信号量 WIKI](https://en.wikipedia.org/wiki/Signal_(IPC)#SIGTERM) SIGTERM进程能响应；SIGKILL进程无法响应操作 我们熟悉的 `kill -9`

* 一般的stop一个service的过程是: 先发送一个SIGTERM信号`kill -15` 如果超过n秒进程仍没有退出再`kill -9 pid`

  

现在我们重点来看，如果程序不响应中止信号直接被强杀，Kafka会有什么问题？

我们假设Kafka cluster是高可用的，version=2.8.0 Kraft未启用,分别看producer和consumer的情况

## producer

我们知道Kafka client SDK producer 有两种发送方式：同步发送消息，异步发送消息。当前我们的代码库几乎都是使用的是异步发送方式。

和producer相关的参数很多，现在我们只看和我们这个话题最相关的几个。

`batch.size` 当多个消息被发送到同一个分区时，生产者会把它们放在一个批次，这个参数指定一个批次可以使用的内存大小

`linger.ms` 该参数指定生产者在发送之前等待更多消息加入批次的时间

KafkaProducer会在`linger.ms`达到上限或`batch.size`填满时批次把消息发送出去

`receive.buffer.bytes` 和`send.buffer.bytes` 该参数分别指定TCP socket接受和发送数据包的缓冲区大小，如果设为-1，代表使用操作系统默认值。

由上我们可知，producer是存在buffer的，sdk层面和操作系统层面，如果进程被强杀，producer来不及flush，就会出现消息丢失。如果消息丢失是不可容忍的对业务一致性影响很大，我们就得想办法提高robustness。

还有一种情况在producer失败的时候可能因为强杀而来不及重试或处理，也会丢失消息。涉及到的参数：

`acks` 表示有多少个分区副本收到消息，生产者才认为消息写入成功

`retries` 生产者收到服务器的错误 又可能是临时性的错误，在这种情况下生产者可以重发消息的次数。通过`retry.backoff.ms`参数控制重试间隔



# consumer

consumer提交偏移量的方式有：自动提交，提交当前偏移量，异步提交，同步和异步组合提交，提交特定的偏移量。我们的代码库几乎都是使用自动提交方式。consumer的情况会更复杂，我们假设不发生reblance（再均衡）的情况，只讨论自动提交的场景。

自动提交涉及到的参数：

`enable.auto.commit` 为true开启

`auto.commit.interval.ms` 提交时间间隔默认5s

由上我们可以看到，如果消费过程中被强杀还来不及commit offset 当当前分区分配给其他consumer或者这个consumer上线继续consumer 必然会出现消息重复消费的情况。

多数情况重复消费是很难避免的，整个系统cluster+consumer 要保证at-least-once（至少一次）还比较容易，保证exactly-once（恰好一次）比较难。所以程序员来说尽量要把event和event 消费的过程设计成幂等的。



举个例子：

事件

```
Event_Good {
  oldValue :2
  newValue: 4
}

Event_Bad {
  Value_Change: 2
}
```

前者event可以幂等消费，后者则不行。



消费过程：

```
update demo set data = data + 1 //bad 

update demo set data = new_date //good
```



ok,就聊到这里，希望对大家打码的时候有帮助。









