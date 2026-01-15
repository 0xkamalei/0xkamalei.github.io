---
title: "通过 go 关键字创建 routine 的坑"
date: 2022-11-07
slug: go-routine-holes
tags: ['go', '编程语言', '技术']
draft: false
---


虽然go提供了 go func (){} 可以直接起一个go routine运行，但是实际并不推荐这样用好像，这块知识有点模糊，网上搜不到相关内容，谈下我理解，希望大佬指明道路


不推荐这么用的原因在于，如果程序收到信号优雅退出，这个go rontine可能还没运行完程序就退出了，同时也没法取消，可能导致业务数据不一致。


解决办法有三：


第一种 多数人会 errorgroup https://pkg.go.dev/golang.org/x/sync/errgroup，有一个全局的errorgroup go变成了 g.GO 然后优雅退出的时候可以wait 也可以cancel


第二种就是通过channel，这好像更多用于一个go rountine的时候，相当于有一个全局的zero size chan, go func() {  chan<- struct{}{}} 在优雅退出的时候 读完<-chan 再退出


第三种 就是自己封装一个stopper cockroach有个例子https://github.com/cockroachdb/cockroach/blob/master/pkg/util/stop/stopper.go


或者说还有别的更 go style的方式？


参考文章：https://codewithyury.com/golang-wait-for-all-goroutines-to-finish/


https://juejin.cn/post/7068226142611701791

