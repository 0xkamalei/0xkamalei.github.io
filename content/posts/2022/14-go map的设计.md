---
title: why go map design like this
date: 2022-12-02 17:53:53
categories: ['技术']
tags: ["go"]
slug: go-map-design
---

## go map for 循环为什么是无序的？
下面的示例代码，每次输出的结果大概率是不一样的。

```
func TestDemo(t *testing.T) {

	m := make(map[int32]string)
	m[0] = "a"
	m[1] = "b"
	m[2] = "c"
	m[3] = "d"
	m[4] = "e"

	for k, v := range m {
		fmt.Printf("K: %d, V: %s \n", k, v)
	}
}
```

博主不会告诉你的是，这里面深层次的原因是：[Hyrum’s Law 海勒姆定律](https://qiangmzsx.github.io/Software-Engineering-at-Google/#/zh-cn/Chapter-1_What_Is_Software_Engineering/Chapter-1_What_Is_Software_Engineering?id=hyrums-law-海勒姆定律)。
给大忙人的一句话概括解释是：你暴露什么API无所谓，只要你的实现是可探查的，别人就会依赖你实现而不是接口
这里map的语义就是无序的 但是之前的版本在某些情况下 map是有序的，开发人员就会依赖这个，面试官就会考这个，为了打破这一点，map在实现的时候，通过随机起始key，来达到无序。



## go map bucket桶的size为什么是8？
golang 中的 `map` 底层实现由 `hmap`，维护着若干个 `bucket` 数组，通常每个 `bucket` 保存着 8 组 kv 对，如果超过 8 个 (发生 hash 冲突时)，会在 `extra` 字段结构体中的 `overflow` ，使用链地址法一直扩展下去。
这个和java hashmap linkarray超过8个会树化的原因是一样的。
可以参考java hashmap的注释。
https://hg.openjdk.java.net/jdk8/jdk8/jdk/file/687fd7c7986d/src/share/classes/java/util/HashMap.java
从中可以看到这里深层次的原因是：[泊松分布](http://en.wikipedia.org/wiki/Poisson_distribution)。
我粗浅的理解：这是一个统计学上的概念，也就是说大多数情况hash 冲突超过8次的概率很低了。当然在go里面是key的前8个bits冲突
java hashmap中给出的数据

```
     * 0:    0.60653066
     * 1:    0.30326533
     * 2:    0.07581633
     * 3:    0.01263606
     * 4:    0.00157952
     * 5:    0.00015795
     * 6:    0.00001316
     * 7:    0.00000094
     * 8:    0.00000006
```