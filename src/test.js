import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { DagreGraphComponent, dagreGraphInit } from './modules/index'

class Index extends Component {
	constructor(props) {
		super(props)
		this.config = {
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
				// console.log('当前hover节点', x, y, node)
			},
			onEmptyHover: () => {
				// console.log('当前位置为空')
			},
			onNodeClick: ({ x, y, node }) => {
				console.log('当前点击节点', x, y, node)
			},
			onNodeRightClick: ({ x, y, node }) => {
				console.log('当前右键点击节点', x, y, node)
			}
		}
	}

	render() {
		return (
			<React.Fragment>
				<DagreGraphComponent {...this.config} onInit={(graph) => this.graph = graph} />
				<button onClick={() => this.graph.reset()}>重置</button>
				<button onClick={() => this.graph.focus('7')}>聚焦到test7</button>
				<button onClick={() => this.graph.zoom(0.1)}>缩放到0.1</button>
				<button onClick={() => {
					let nodes = this.graph.findRelateNodes('7')
					console.log(nodes)
					this.graph.activeTargetNodes(nodes.map(node => node.nodeInfo.id))
				}}>查找test7关联节点，并高亮</button>
			</React.Fragment>
		)
	}
}

ReactDOM.render(<Index />, document.getElementById('root'))
