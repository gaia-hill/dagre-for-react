[![npm version](https://img.shields.io/npm/v/dagre-for-react.svg?style=flat)](https://www.npmjs.com/package/dagre-for-react)

### 关系图
基于dagre、three.js开发的关系图组件，支持react

#### 安装

`npm i dagre-for-react`


#### 使用

引入组件`import { DagreGraphComponent, dagreGraphInit } from 'dagre-for-react'`

增加配置
```javascript
	const config = {
		zoom: 0.3,
		minZoom: 0.01,
		maxZoom: 1.5,
		height: '700px',
		width: '900px',
		layoutConfig: {},
		theme: {
			mainNode: "#FFFFFF",
			mainBkg: "#2E86C1",

			activeNode: "#658FFC",
			activeBkg: "#EFF3FF",

			staticNode: "#273746",
			staticBkg: "#ABB2B9",

			senceBackground: '#FDEDEC',
			edgeColor: "#CACFD2"
		},
		data: {
			mainNode: '4',
			nodes: [
				{ label: 'test1', id: '1' },
				{ label: 'test2', id: '2' },
				{ label: 'test3', id: '3' },
				{ label: 'test4', id: '4' },
				{ label: 'test5', id: '5' },
				{ label: 'test6', id: '6' },
				{ label: 'test7', id: '7' },
				{ label: 'test8', id: '8' },
				{ label: 'test9', id: '9' },
				{ label: 'test10', id: '10' },
				{ label: 'test11', id: '11' }
			],
			edges: [
				{ source: '1', target: '4' },
				{ source: '2', target: '4' },
				{ source: '3', target: '4' },
				{ source: '4', target: '5' },
				{ source: '4', target: '6' },
				{ source: '4', target: '7' },
				{ source: '7', target: '8' },
				{ source: '7', target: '9' },
				{ source: '7', target: '10' },
				{ source: '11', target: '2' }
			],
		},
		onNodeHover: ({ x, y, node }) => {
			console.log('当前hover节点', x, y, node)
		},
		onEmptyHover: () => {
			console.log('当前位置为空')
		},
		onNodeClick: ({ x, y, node }) => {
			console.log('当前点击节点', x, y, node)
		},
		onNodeRightClick: ({ x, y, node }) => {
			console.log('当前右键点击节点', x, y, node)
		}
	}
```
##### 方式1（react）
```javascript
	const Page = () => {
		return (
			<DagreGraphComponent {...config} onInit={(graph) => { }} />
		)
	}
```

##### 方式2（dom）

```javascript
	const dom = document.querySelector('#root')
	const graph = dagreGraphInit(Object.assign({}, config, { dom }))
```
3、效果：
![alt](<https://raw.githubusercontent.com/okmengzhilin/UED-FE/master/img/demo.png>)

#### 初始化

初始化方法或onInit方法，可返回图的实例（onInit仅在react组件中支持）
const graph = dagreGraphInit(config)
<DagreGraphComponent {...config} onInit={(graph) => { }} />

#### Config

##### - dom（element）
关系图渲染的容器，仅通过dagreGraphInit方法生成时必传

##### - zoom（number）
初始的缩放级别，默认为0.15

##### - minZoom（number）
最小的缩放级别，默认为0.01

##### - maxZoom（number）
最小的缩放级别，默认为1.5

##### - senceBackground（string）
关系图的背景，默认为#FFFFFF

##### - theme（object）
- mainNode：主节点颜色
- mainBkg：主节点背景颜色
- staticNode：分支节点颜色
- staticBkg：分支节点背景颜色
- activeNode：高亮时节点颜色
- activeBkg：高亮时节点背景颜色
- edgeColor：连接线颜色
- senceBackground：场景背景颜色

##### - data（object）
关系图的数据共有三个属性nodes，edges，mainNode

- nodes（Array）：关系图中的节点，格式为 `{ label: 'test1', id: '1'}`，其中label（string，必传）为节点的显示名称，id为唯一值，如果没有传id，则id默认为label的值


- edges（Array）：关系图中的边信息，格式为 `{ source: '1', target: '4' }`，其中source、target为边两端节点的id


- mainNode（string）：关系图的中心节点（主节点），值为节点的id，设置后关系图会以此节点为中心绘制，推荐添加此属性


##### - layoutConfig（布局的设置，基于dagre）
dagre的布局配置，具体的配置参考链接中graph的配置<https://github.com/dagrejs/dagre/wiki#configuring-the-layout>


##### - onNodeHover（function({x,y,node})）
节点hover事件回调函数，可接收x,y,node参数，x、y为当前节点对应的dom坐标，node为关系图中当前节点的信息

##### - onEmptyHover（function）
图中非节点处hover事件回调函数

##### - onNodeClick（function({x,y,node})）
节点点击事件回调函数，可接收x,y,node参数，x、y为当前节点对应的dom坐标，node为关系图中当前节点的信息

##### - onNodeRightClick（function({x,y,node})）
节点右键点击事件回调函数，可接收x,y,node参数，x、y为当前节点对应的dom坐标，node为关系图中当前节点的信息

##### - onInit（function(graph)）（react组件方式特有）
关系图初始化完成后的回调函数，可拿到关系图对象


#### 方法

##### - graph.activeTargetNodes(ids:Array)
匹配ids中包含id的节点，并使其高亮

##### - graph.findRelateNodes(id):Array[node]
通过节点id匹配图中与其关联的节点，并返回匹配到的所有节点

##### - graph.focus(id)
设置图的中心节点，参数为节点id

##### - graph.zoom(level)
设置关系图的缩放级别，level为 minZoom - maxZoom 之间的值

##### - graph.reset()
重置关系图到初始状态

##### - graph.setData(data)
重新设置关系图的数据并渲染，data格式同上，data中属性会合并到原始配置中
