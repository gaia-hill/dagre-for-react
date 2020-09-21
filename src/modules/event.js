//  绑定图中的交互事件

import * as THREE from 'three'

// 获取屏幕鼠标位置对应的threejs世界坐标
export const initMouseVector = (event) => {
	let threeCanvas = document.querySelector("#three-container canvas")
	let mouseX = (event.clientX - threeCanvas.getBoundingClientRect().left) / threeCanvas.offsetWidth * 2 - 1
	let mouseY = -((event.clientY - threeCanvas.getBoundingClientRect().top) / threeCanvas.offsetHeight ) * 2 + 1

	return {mouseX, mouseY}
}

// 通过场景中节点世界坐标，获取对应的屏幕坐标
export const getNodeScreenPointer = (mesh, camera) => {
	let threeCanvas = document.querySelector("#three-container canvas")
	let worldVector = new THREE.Vector3(
		mesh.object.position.x,
		mesh.object.position.y - mesh.object.nodeInfo.height/2 + 5,
		mesh.object.position.z,
	)
	let standardVector = worldVector.project(camera)

	let x = Math.round(standardVector.x * (threeCanvas.offsetWidth/2) + threeCanvas.offsetWidth/2)
	let y = Math.round(-standardVector.y * (threeCanvas.offsetHeight/2) + threeCanvas.offsetHeight/2)

	return {x,y}
}

export const getScreenPointerByWorld = (point, camera) => {
	let threeCanvas = document.querySelector("#three-container canvas")
	let worldVector = new THREE.Vector3(point.x, point.y, 0)
	let standardVector = worldVector.project(camera)

	let x = Math.round(standardVector.x * (threeCanvas.offsetWidth/2) + threeCanvas.offsetWidth/2)
	let y = Math.round(-standardVector.y * (threeCanvas.offsetHeight/2) + threeCanvas.offsetHeight/2)

	return {x,y}
}

export default (scene, camera, defaultOptions) => {
	let mouseDownX = 0
	let mouseDownY = 0
	let raycaster = new THREE.Raycaster()
	let mouseVector = new THREE.Vector2()
	let threeBoxCanvas = document.querySelector("#three-container canvas")
	// let threeBox = defaultOptions.dom

	threeBoxCanvas.addEventListener("mousedown",(event) => {
		if(!defaultOptions.onNodeClick && !defaultOptions.onEmptyClick){return}
		event.preventDefault()
		mouseDownX = event.clientX
		mouseDownY = event.clientY
	})

	// 鼠标点击节点时交互
	threeBoxCanvas.addEventListener("mouseup",(event) => {
		if (!defaultOptions.onNodeClick && !defaultOptions.onEmptyClick) { return }
		event.preventDefault()
		// 如果mousedown和mouseup在同一位置，则认为是点击，触发点击事件，button=0为左键点击
		if(event.button === 0 && event.clientX === mouseDownX && event.clientY === mouseDownY){
			let mouse = initMouseVector(event)
			mouseVector.set(mouse.mouseX, mouse.mouseY)
			raycaster.setFromCamera( mouseVector, camera )
			let intersects = raycaster.intersectObjects( scene.children )   // 获取点击位置场景中的对象
			let meshArr = intersects.filter(node=>node.object.meshType==="label")
			let selectedNodes = meshArr.map(node=>node.object.nodeInfo)

			if (selectedNodes.length > 0) {   // 如果有点击对象
				let { x, y } = getNodeScreenPointer(meshArr[0], camera)
				defaultOptions.onNodeClick({
					x, y, node: selectedNodes[0]
				}, event)
			} else if (defaultOptions.onEmptyClick) {
				defaultOptions.onEmptyClick(event)
			}
		}
	})

	// 鼠标移动时交互
	threeBoxCanvas.addEventListener("mousemove",(event) => {
		if(!defaultOptions.onNodeHover && !defaultOptions.onEmptyHover ){return}
		event.preventDefault()
		let mouse = initMouseVector(event)
		mouseVector.set(mouse.mouseX, mouse.mouseY)
		raycaster.setFromCamera( mouseVector, camera )

		let intersects = raycaster.intersectObjects( scene.children )
		let meshArr = intersects.filter(node=>node.object.meshType==="label")
		let selectedNodes = meshArr.map(node=>node.object.nodeInfo)
		if(selectedNodes.length>0){
			let {x, y} = getNodeScreenPointer(meshArr[0], camera)
			defaultOptions.onNodeHover({
				x,y,node: selectedNodes[0]
			}, event)
		}else if(defaultOptions.onEmptyHover){
			defaultOptions.onEmptyHover(event)
		}
	})

	// 鼠标右键交互
	threeBoxCanvas.addEventListener("contextmenu",(event) => {
		if (!defaultOptions.onNodeRightClick && !defaultOptions.onEmptyRightClick) { return }
		event.preventDefault()
		let mouse = initMouseVector(event)
		mouseVector.set(mouse.mouseX, mouse.mouseY)
		raycaster.setFromCamera( mouseVector, camera )
		let intersects = raycaster.intersectObjects( scene.children )
		let meshArr = intersects.filter(node=>node.object.meshType==="label")
		let selectedNodes = meshArr.map(node=>node.object.nodeInfo)
		if(selectedNodes.length>0){
			let {x, y} = getNodeScreenPointer(meshArr[0], camera)
			defaultOptions.onNodeRightClick({
				x,y,node: selectedNodes[0]
			}, event)
		}else if(defaultOptions.onEmptyRightClick){
			defaultOptions.onEmptyRightClick(event)
		}
	})
}
