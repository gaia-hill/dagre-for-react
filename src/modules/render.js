import * as THREE from 'three'
import bindEvent, { getScreenPointerByWorld } from './event'

import loadMapContral from './MapControls'
loadMapContral(THREE)

let props = {}
let renderer, camera, controls, scene;
let arrowLineMaterial
let nodeTypes = ['main', 'static', 'active']
let materialList = []
const labelMaterialMap = {}
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
let vector2Temp = new THREE.Vector2()
let lineTemp = new THREE.Line()
let geometryTemp = new THREE.BufferGeometry()
let vector3Temp = new THREE.Vector3()

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
		if (object.meshType === "label" && object.nodeInfo['id'] === active_id) {
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
		if (object.meshType === "label" && active_list.includes(object.nodeInfo['id'])) {
			active_nodes.push(object)
		} else if (object.meshType === "label") {
			let node = object.nodeInfo
			let color = node.nodeType === "main" ? props.nodeColor["main"] : props.nodeColor["static"]
			let backgroundColor = node.nodeType === "main" ? props.nodeColor["mainBkg"] : props.nodeColor["staticBkg"]
			object.material = drawLableMaterial(object.nodeInfo, color, backgroundColor)
		}
	})
	changeNodeStyle(active_nodes)
}

function changeNodeStyle(active_nodes) {
	// 设置活跃节点的样式，就是变色，但是需要重新绘制节点的材质
	let nodes = scene.children.filter(object => object.meshType === 'label')
	let borders = scene.children.filter(object => object.meshType === 'border')
	active_nodes.forEach((object) => {
		object.material = drawLableMaterial(object.nodeInfo, props.nodeColor['active'], props.nodeColor['activeBkg'])
	})
	nodes.forEach(group => {
		let isActive = active_nodes.some(obj => obj.nodeInfo['id'] === group.nodeInfo['id'])
		group.children.forEach(child => {
			let type = isActive ? 'active' : getNodeType(group.nodeInfo)
			let typeIndex = nodeTypes.indexOf(type)
			child.material = materialList[typeIndex]
		})
	})
	borders.forEach(border => {
		let isActive = active_nodes.some(obj => obj.nodeInfo['id'] === border.nodeInfo['id'])
		let type = isActive ? 'active' : getNodeType(border.nodeInfo)
		let color = props.nodeColor[type]
		border.material = getBorderLineMaterial(color)
	})
}

export const reset = (layoutData) => {
	rerender(layoutData, true)
}

export const focus = (id) => {
	for (let i = 0; i < scene.children.length; i++) {
		const object = scene.children[i];
		if (object.meshType === "label" && object.nodeInfo['id'] === id) {
			const threeBox = document.querySelector("#three-container canvas")
			const { x, y } = threeBox.getBoundingClientRect()
			const start = getScreenPointerByWorld(object.position, camera)
			controls.panEnd = vector2Temp.clone().set(x + threeBox.offsetWidth / 2, y + threeBox.offsetHeight / 2)
			controls.panStart =  vector2Temp.clone().set(start.x + x, start.y + y)
			controls.panDelta.subVectors(controls.panEnd, controls.panStart).multiplyScalar( controls.panSpeed )
			controls.pan( controls.panDelta.x, controls.panDelta.y )
			controls.panStart.copy( controls.panEnd )
			controls.update()
			return
		}
	}
}

export const zoom = (level) => {
	if (level) {
		camera.zoom = level
		camera.updateProjectionMatrix()
		return
	}
	return camera.zoom
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

		let labelMesh = meshTemp.clone()
		labelMesh.geometry = nodeGeometry
		labelMesh.material = drawLableMaterial(node, color, backgroundColor)
		labelMesh.position.x = node.x + centerX
		labelMesh.position.y = node.y + centerY
		labelMesh.position.z = 0;
		labelMesh.rotation.z = Math.PI
		labelMesh.nodeInfo = node
		labelMesh.meshType = 'label'
		labelMesh.renderOrder = 3
		scene.add(labelMesh)

		var lineMaterial = getBorderLineMaterial(color)
		let x = labelMesh.position.x - node.width / 2
		let y = labelMesh.position.y - node.height / 2
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
		lineLine.meshType = 'border'
		scene.add( lineLine )
	})
}

const drawLableMaterial = (node, color, backgroundColor) => {
	const type = node.id + color
	if (!labelMaterialMap[type]) {
		let canvas = document.createElement('canvas')
		canvas.width = node.width
		canvas.height = node.height
		let ctx = canvas.getContext('2d')
		ctx.fillStyle = backgroundColor
		ctx.fillRect(0, 0, node.width, node.height)
		ctx.font = '70px sans-serif'
		ctx.fillStyle = color
		let width = ctx.measureText(node.label).width
		ctx.fillText(node.label, (node.width - width) / 2, 70 + 20)

		let material = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas, undefined, undefined, undefined, undefined, THREE.LinearFilter)})
		labelMaterialMap[type] = material
	}
	return labelMaterialMap[type]
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
