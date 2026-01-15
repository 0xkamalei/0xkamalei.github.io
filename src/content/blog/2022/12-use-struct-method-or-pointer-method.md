---
title: "结构体方法或者指针方法？"
date: 2022-11-08
slug: use-struct-method-or-pointer-method
tags: ['go', '编程语言', '技术']
draft: false
---


我看到代码库里有这两种风格的代码，研究了一下区别，自问自答记录一下学习分享给大家


第一种 实现结构体方法


```plain text
func (a XXXImpl) CreateItem(ctx context.Context) (int64, error) {
}
```


第二种 实现指针方法


```plain text
func (a *XXXImpl) CreateItem(ctx context.Context) (int64, error) {
}
```


大家可以跑一下这个测试用例体会一下区别


```plain text
package method

import "testing"

type person struct {
	token string
}

func (p person) set_token(newvalue string) {
	p.token = newvalue
}

func (p *person) set_token_2(newvalue string) {
	p.token = newvalue
}

func TestCallMeth(t *testing.T) {
	p := person{"akka"}
	p.set_token("abc")
	print(p.token + "\n") // akka
	p.set_token_2("opq")
	print(p.token + "\n") //opq

	pt := &person{"fff"}
	pt.set_token("abc")
	print(p.token + "\n") // opq
	pt.set_token_2("opq")
	print(p.token + "\n") //opq
}
```


总结一下区别就是：


方法是语法糖，第一个参数是receiver（结构体副本，指针副本）


如果是用指针作为接收者，那么变量（结构体对象）本身是可以修改的，因为指针传递的是变量的地址，因此变量内部的数据可以修改。


如果用值作为接收者，那么对象内部的数据无法修改，因为用值作为接收者，在调用方法时，传递进去的是对象的副本，即使修改也只是修改副本的值，原对象的数据不会发生改变。这种可以理解为对象在该方法内是只读的。


原理解读：https://www.bilibili.com/video/BV1Yt4y1Q7A5


那么问题来了，我们到底应该用哪种方式呢？


这里就要考虑到值复制成本的问题。更多可以参考https://gfw.go101.org/article/value-copy-cost.html


摘要：


为了防止在函数传参和通道操作中因为**值复制代价太高而造成的性能损失**，我们应该避免使用大尺寸的结构体和数组类型做为参数类型和通道的元素类型，应该在这些场合下使用基类型为这样的大尺寸类型的指针类型。 另一方面，我们也要考虑到**太多的指针将会增加垃圾回收的压力**。所以到底应该使用大尺寸类型还是以大尺寸类型为基类型的指针类型做为参数类型或通道的元素类型**取决于具体的应用场景**。


所以最后并没有唯一的答案。

