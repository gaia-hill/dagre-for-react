
import dagre from 'dagre'

let canvas = document.createElement("canvas")
let context = canvas.getContext("2d")
context.font = '70px sans-serif'

export default class DagreData {

	layout(options) {
		let data = options.data
		let graph = new dagre.graphlib.Graph()
		graph.setGraph(Object.assign({}, {
			rankdir: 'LR',
			ranksep: 400,
			nodesep: 100,
			edgesep: 20
		}, options.layoutConfig))

		graph.setDefaultEdgeLabel(() => ({}))

		data.nodes.map(node => {
			const nodeId = node.id ? node.id : node.label
			graph.setNode(nodeId, {
				label: node.label,
				id: nodeId,
				width: context.measureText(node.label).width + 80,
				height: 80 + 48,
				property: node,
				nodeType: node.id === data.mainNode ? 'main' : 'static'
			})
		})

		data.edges.map(edge => {
			graph.setEdge(edge.source, edge.target)
		})

		dagre.layout(graph)

		let layoutData = {
			nodes: [],
			edges: [],
			center: {
				centerX: 0,
				centerY: 0
			}
		}

		graph.nodes().forEach((node) => {
			let layoutNode = graph.node(node)
			if (layoutNode && layoutNode.nodeType === 'main') {
				layoutData.center = {
					centerX: 0 - layoutNode.x,
					centerY: 0 - layoutNode.y
				}
				layoutData.main = layoutNode
			}
			if (layoutNode) {
				layoutData.nodes.push(layoutNode)
			}
		})

		graph.edges().forEach((edge) => {
			layoutData.edges.push(Object.assign(graph.edge(edge), edge));
		})
		return layoutData
	}

}
