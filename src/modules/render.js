import * as THREE from 'three'
import bindEvent, { getScreenPointerByWorld } from './event'

import loadMapContral from './MapControls'
loadMapContral(THREE)

let props = {}
let renderer, camera, controls, scene;
let arrowLineMaterial;
let canvasWidth = 512
let canvasHeight = 512
let textPositionMap = {}
let nodeTypes = ['main', 'static', 'active']
let canvasList = nodeTypes.map(type => document.createElement('canvas'))
let materialList = []
const nodeMaterialMap = {}
const borderMateralMap = {}
const clock = new THREE.Clock()
let fps = 5

// 当鼠标移动时，刷新帧率从5fps改为40fps
let fpsTimer = null
let isDrag = false
document.addEventListener('mousedown', (e) => {
	if (fpsTimer) {
		clearTimeout(fpsTimer)
	}
	if (e.target.tagName === 'CANVAS') {
		fps = 40
		isDrag = true
	}
	fpsTimer = setTimeout(() => {
		isDrag = false
		fps = 5
	}, 3000)
})
document.addEventListener('mousemove', (e) => {
	if (fpsTimer) {
		clearTimeout(fpsTimer)
	}
	if (e.target.tagName === 'CANVAS' && isDrag) {
		fps = 40
	}
	fpsTimer = setTimeout(() => {
		isDrag = false
		fps = 5
	}, 500)
})

//   公用对象
let meshTemp = new THREE.Mesh()
let groupTemp = new THREE.Group()
let vector2Temp = new THREE.Vector2()
let lineTemp = new THREE.Line()
let geometryTemp = new THREE.BufferGeometry()
let vector3Temp = new THREE.Vector3()


canvasList.forEach(canvas => {
	canvas.width = canvasWidth
	canvas.height = canvasHeight
})
function getLabel(layout_data) {
	let labelSet = new Set()
	let { nodes } = layout_data
	let ctxList = canvasList.map((canvas, index) => canvas.getContext('2d'))
	ctxList.forEach((ctx, index) => {
		let type = nodeTypes[index]
		ctx.clearRect(0, 0, canvasWidth, canvasHeight)
		ctx.fillStyle = props.nodeColor[type + 'Bkg']
		ctx.fillRect(0, 0, canvasWidth, canvasHeight)
		ctx.font = "70px Consolas"
		ctx.fillStyle = props.nodeColor[type]
		ctx.textBaseline = 'top'
	})
	const fontSize = 70
	const padding = 20
	nodes.forEach((node) => {
		for (let i = 0; i < node.label.length; i++) {
			labelSet.add(node.label[i])
		}
	})
	let x = padding, y = padding
	for (let text of labelSet) {
		let width = ctxList[0].measureText(text).width
		let height = fontSize
		if (x + width > canvasWidth) {
			y += fontSize + padding
			x = padding
		}
		textPositionMap[text] = { x, y, width, height }
		ctxList.forEach(ctx => ctx.fillText(text, x, y))
		x += width + padding
	}
	materialList = canvasList.map((canvas, index) => {
		let material = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) })
		material.transparent = false
		return material
	})
}
export default (defaultOptions) => {   // 初始化threejs场景
	initScene()
	bindEvent(scene, camera, defaultOptions)  //  绑定图中的交互事件
	arrowLineMaterial = new THREE.LineBasicMaterial({ color: props.edgeColor, linewidth: 4 })

	function initScene() {
		let threeBox = document.querySelector("#three-container")
		let sceneWidth = threeBox.offsetWidth
		let sceneHeight = threeBox.offsetHeight
		let devicePixel = 2 //window.devicePixelRatio
		renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })  //, precision: 'mediump'
		renderer.setPixelRatio(devicePixel)
		renderer.setSize(sceneWidth, sceneHeight)
		threeBox.appendChild(renderer.domElement)
		renderer.domElement.addEventListener('wheel', () => {
			if (fpsTimer) {
				clearTimeout(fpsTimer)
			}
			fps = 40
			fpsTimer = setTimeout(() => { fps = 5 }, 500)
		})

		// 相机设置
		camera = new THREE.OrthographicCamera(sceneWidth / -2, sceneWidth / 2, sceneHeight / -2, sceneHeight / 2, 0, 1000);
		camera.position.set(0, 0, 500)
		// camera.zoom = 0.4
		camera.zoom = defaultOptions.zoom
		camera.updateProjectionMatrix()
		camera.lookAt(0, 0, 0)

		// 控制器设置，详细配置参考github threejs中MapControls配置
		controls = new THREE.MapControls(camera, renderer.domElement)
		controls.enableRotate = false
		controls.screenSpacePanning = true
		controls.minZoom = defaultOptions.minZoom
		controls.maxZoom = defaultOptions.maxZoom

		scene = new THREE.Scene()
		scene.background = new THREE.Color(props.senceBackground)

		render()
	}
}

export const initColor = (theme) => {
	props = {
		nodeColor: {
			main: theme.mainNode,
			mainBkg: theme.mainBkg,

			active: theme.activeNode,
			activeBkg: theme.activeBkg,

			static: theme.staticNode,
			staticBkg: theme.staticBkg,
		},
		edgeColor: theme.edgeColor,
		senceBackground: theme.senceBackground
	}
}

// 重绘threejs画布
export const rerender = (layoutData, toOrigin) => {
	while (scene.children.length > 0) {  //  清空场景中的对象
		scene.remove(scene.children[0])
	}
	scene.dispose()
	getLabel(layoutData)
	drawNode(layoutData)
	drawLine(layoutData)
	if (toOrigin) {
		controls.reset()
	}
}

// 在图中查找和某个table相关的节点
export const findRelateNodes = (active_id) => {
	let active_nodes = []
	scene.children.forEach((object) => {

		// 如果是当前点击的节点，放到active数组中，如果非点击节点重置样式
		if (object.meshType === "node" && object.nodeInfo['id'] === active_id) {
			active_nodes.push(object)
		}
		// 获取和点击节点相关的edge连接的节点，包括上游和下游
		if (object.meshType === "edge" && object.edgeInfo.w === active_id) {
			let father_node = scene.children.find(father => father.nodeInfo['id'] === object.edgeInfo.v)
			if (father_node) {
				active_nodes.push(father_node)
			}
		}
		if (object.meshType === "edge" && object.edgeInfo.v === active_id) {
			let children_node = scene.children.find(children => children.nodeInfo['id'] === object.edgeInfo.w)
			if (children_node) {
				active_nodes.push(children_node)
			}
		}
	})
	return active_nodes
}
function getNodeType(node) {
	return node.nodeType === 'main' ? 'main' : 'static'
}
// 输入列表搜索关键字触发
export const activeTargetNodes = (active_list) => {
	let active_nodes = []
	scene.children.forEach((object) => {
		// 如果包含该节点，放到active数组中，否则重置样式
		if (object.meshType === "node" && active_list.includes(object.nodeInfo['id'])) {
			active_nodes.push(object)
		} else if (object.meshType === "node") {
			let node = object.nodeInfo
			let color = node.nodeType === "main" ? props.nodeColor["main"] : props.nodeColor["static"]
			let backgroundColor = node.nodeType === "main" ? props.nodeColor["mainBkg"] : props.nodeColor["staticBkg"]
			object.material = drawNodeMaterial(object.nodeInfo, color, backgroundColor)
		}
	})
	changeNodeStyle(active_nodes)
}

function changeNodeStyle(active_nodes) {
	// 设置活跃节点的样式，就是变色，但是需要重新绘制节点的材质
	let groups = scene.children.filter(object => object.meshType === 'label')
	let lines = scene.children.filter(object => object.meshType === 'line')
	active_nodes.forEach((object) => {
		object.material = drawNodeMaterial(object.nodeInfo, props.nodeColor['active'], props.nodeColor['activeBkg'])
	})
	groups.forEach(group => {
		let isActive = active_nodes.some(obj => obj.nodeInfo['id'] === group.nodeInfo['id'])
		group.children.forEach(child => {
			let type = isActive ? 'active' : getNodeType(group.nodeInfo)
			let typeIndex = nodeTypes.indexOf(type)
			child.material = materialList[typeIndex]
		})
	})
	lines.forEach(line => {
		let isActive = active_nodes.some(obj => obj.nodeInfo['id'] === line.nodeInfo['id'])
		let type = isActive ? 'active' : getNodeType(line.nodeInfo)
		let color = props.nodeColor[type]
		line.material = getBorderLineMaterial(color)
	})
}

export const reset = (layoutData) => {
	rerender(layoutData, true)
}

export const focus = (id) => {
	for (let i = 0; i < scene.children.length; i++) {
		const object = scene.children[i];
		if (object.meshType === "node" && object.nodeInfo['id'] === id) {
			const threeBox = document.querySelector("#three-container")
			const { x, y } = threeBox.getBoundingClientRect()
			const start = getScreenPointerByWorld(object.position, camera)
			controls.panEnd = vector2Temp.clone().set(x + threeBox.offsetWidth / 2, y + threeBox.offsetHeight / 2)
			controls.panStart =  vector2Temp.clone().set(start.x, start.y)
			controls.panDelta.subVectors(controls.panEnd, controls.panStart).multiplyScalar( controls.panSpeed )
			controls.pan( controls.panDelta.x, controls.panDelta.y )
			controls.panStart.copy( controls.panEnd )
			controls.update()
			return
		}
	}
}

export const zoom = (level) => {
	camera.zoom = level
	camera.updateProjectionMatrix()
}

export const drawNodeMaterial = (node, color, backgroundColor) => {
	const type = color + backgroundColor
	if (!nodeMaterialMap[type]) {
		nodeMaterialMap[type] = new THREE.MeshBasicMaterial({ color: backgroundColor })
	}
	return nodeMaterialMap[type]
}

// 初始化threejs场景
let timeS = 0
function render(ts) {
	let T = clock.getDelta()
	let renderT = 1 / fps
	timeS = timeS + T;
	if (timeS > renderT) {
		scene.dispose()
		renderer.render(scene, camera)
		timeS = 0;
	}
	requestAnimationFrame(render)
}

// 绘制所有节点
function drawNode(layout_data) {
	let { centerX, centerY } = layout_data.center
	layout_data.nodes.map((node) => {

		let nodeGeometry = new THREE.BoxBufferGeometry(node.width, node.height, 0);

		// 手动绘制文字
		let color = node.nodeType === "main" ? props.nodeColor['main'] : props.nodeColor["static"]
		let backgroundColor = node.nodeType === "main" ? props.nodeColor["mainBkg"] : props.nodeColor["staticBkg"]
		let nodeType = getNodeType(node)
		let typeIndex = nodeTypes.indexOf(nodeType)
		var nodeMaterial = drawNodeMaterial(node, color, backgroundColor)
		let nodeMesh = meshTemp.clone()
		nodeMesh.geometry = nodeGeometry
		nodeMesh.material = nodeMaterial
		nodeMesh.position.x = node.x + centerX
		nodeMesh.position.y = node.y + centerY
		nodeMesh.position.z = 0;
		nodeMesh.nodeInfo = node
		nodeMesh.rotation.z = Math.PI  //  这一块如果不在z轴旋转180度，文字是倒立的
		nodeMesh.meshType = 'node'
		nodeMesh.material.depthTest = false
		nodeMesh.renderOrder = 2
		scene.add(nodeMesh);

		let group = groupTemp.clone()
		group.nodeInfo = node
		group.meshType = 'label'
		let startX = node.x
		let avgWidth = (node.width - 50) / node.label.length
		function getVector(x, y) {
			x = x / canvasWidth,
				y = (canvasHeight - y) / canvasHeight
			let point = vector2Temp.clone()
			point.x = x
			point.y = y
			return point
		}
		for (let i = 0; i < node.label.length; i++) {
			let text = node.label[i]
			let textPosition = textPositionMap[text]
			let { x, y, width, height } = textPosition
			let padding = 1
			let ypadding = 3
			if (width < avgWidth) {
				padding = (avgWidth - width) / 2
			}
			let labelGeometry = new THREE.BoxGeometry(avgWidth, height, 0)
			let labelUv = [
				getVector(x + width + padding, y + height + ypadding), // 右下
				getVector(x + width + padding, y - ypadding), //右上
				getVector(x - padding, y - ypadding), //左上
				getVector(x - padding, y + height + ypadding), //左下
			]
			// 左下 左右  右上 右下
			// 参考文章：https://techbrood.com/zh/news/webgl/%E6%B7%B1%E5%85%A5%E7%90%86%E8%A7%A3three_js%E7%BA%B9%E7%90%86%E8%B4%B4%E5%9B%BE%E5%92%8Cuv%E6%98%A0%E5%B0%84.html
			//顶面两个三角形
			// labelGeometry.faceVertexUvs[0] = []
			labelGeometry.faceVertexUvs[0][10] = [labelUv[0], labelUv[1], labelUv[3]]
			labelGeometry.faceVertexUvs[0][11] = [labelUv[1], labelUv[2], labelUv[3]]
			let labelMesh = meshTemp.clone()
			labelMesh.geometry = labelGeometry
			labelMesh.material = materialList[typeIndex]
			labelMesh.position.x = startX + centerX - node.width / 2 + 40
			labelMesh.position.y = node.y + centerY
			labelMesh.position.z = 0
			labelMesh.depthTest = false
			startX += avgWidth
			group.add(labelMesh)
		}
		group.renderOrder = 3
		scene.add(group)

		var lineMaterial = getBorderLineMaterial(color)
		let x = nodeMesh.position.x - node.width / 2
		let y = nodeMesh.position.y - node.height / 2
		var points = []
		points.push( new THREE.Vector3( x, y, 0 ) )
		points.push( new THREE.Vector3( x + node.width, y, 0 ) )
		points.push( new THREE.Vector3( x + node.width, y + node.height, 0 ) )
		points.push( new THREE.Vector3( x, y + node.height, 0 ) )
		points.push( new THREE.Vector3( x, y, 0 ) )

		var lineGeometry = new THREE.BufferGeometry().setFromPoints( points );
		let lineLine = lineTemp.clone()
		lineLine.geometry = lineGeometry
		lineLine.material = lineMaterial
		lineLine.renderOrder = 1
		lineLine.nodeInfo = node
		lineLine.meshType = 'line'
		scene.add( lineLine )
	})
}

function getBorderLineMaterial(color) {
	if (!borderMateralMap[color]) {
		borderMateralMap[color] = new THREE.LineBasicMaterial({ color, linewidth: 4 })
	}
	return borderMateralMap[color]
}

// 绘制所有的边
function drawLine(layout_data) {
	let { centerX, centerY } = layout_data.center
	layout_data.edges.map((edge) => {
		let color = props.edgeColor
		let material = arrowLineMaterial
		let edgePoints = edge.points

		let geometry = geometryTemp.clone()
		let positions = []
		edgePoints.map((v) => {
			let point = vector3Temp.clone()
			point.x = v.x + centerX
			point.y = v.y + centerY
			point.z = 0
			positions.push(v.x + centerX, v.y + centerY, 0)
		})
		geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

		let len = edgePoints.length

		let sourcePosition = {
			x: edgePoints[len - 2].x + centerX,
			y: edgePoints[len - 2].y + centerY,
			z: 0
		}
		let targetPosition = {
			x: edgePoints[len - 1].x + centerX,
			y: edgePoints[len - 1].y + centerY,
			z: 0
		}

		let line = lineTemp.clone()
		line.geometry = geometry
		line.material = material
		line.material.depthTest = false
		line.renderOrder = 1
		line.edgeInfo = edge
		line.meshType = "edge"
		scene.add(line)

		// 绘制箭头
		let direction = vector3Temp.clone()
		direction.subVectors(targetPosition, sourcePosition)
		direction.normalize()
		let end = vector3Temp.clone()
		end.x = targetPosition.x
		end.y = targetPosition.y
		end.z = targetPosition.z
		let start = vector3Temp.clone()
		start.x = sourcePosition.x
		start.y = sourcePosition.y
		start.z = sourcePosition.z
		let length = end.distanceTo(start);
		var arrowHelper = new THREE.ArrowHelper(direction, start, length, color, 30, 20);
		arrowHelper.arrowInfo = edge
		scene.add(arrowHelper)
	})
}