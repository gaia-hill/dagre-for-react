
import React, { useEffect } from 'react'
import DagreData from './dagreData.js'
import initRender, { initColor, rerender, activeTargetNodes, findRelateNodes, focus, zoom, reset } from './render'

export const DagreGraphComponent = (props) => {
	const style = {
		height: props.height || '100%',
		width: props.width || '100%'
	}
	useEffect(() => {
		const dom = document.querySelector('.dagre-graph-container')
		const graph = dagreGraphInit(Object.assign({}, props, { dom }))
		if (props.onInit) {
			props.onInit(graph)
		}
	})
	return (
		<div className="dagre-graph-container" style={style}></div>
	)
}

export const dagreGraphInit = (options) => {
	let defaultOptions = Object.assign({}, {
		dom: null,
		zoom: 0.15,
		minZoom: 0.01,
		maxZoom: 1.5,
		data: {
			nodes: [],
			edges: [],
			mainNode: null,
		},
		layoutConfig: {},
		onNodeHover: false,
		onEmptyHover: false,
		onNodeClick: false,
		onNodeRightClick: false
	}, options, {
		theme: Object.assign({}, {
			mainNode: "#FFFFFF",
			mainBkg: "#2E86C1",

			activeNode: "#658FFC",
			activeBkg: "#EFF3FF",

			staticNode: "#273746",
			staticBkg: "#ABB2B9",

			senceBackground: '#FFFFFF',
			edgeColor: "#CACFD2"
		}, options.theme)
	})

	if (defaultOptions.dom) {
		initColor(defaultOptions.theme)
		createInnerDom(defaultOptions.dom, defaultOptions.height, defaultOptions.width)
		let dagreData = new DagreData()
		let layoutData = dagreData.layout(defaultOptions)
		initRender(defaultOptions)
		rerender(layoutData)
		return {
			activeTargetNodes,
			findRelateNodes,
			focus,
			reset: () => {
				reset(layoutData)
			},
			zoom: (level) => {
				if (level === undefined) {
					return zoom()
				}
				if (defaultOptions.minZoom <= level && level <= defaultOptions.maxZoom) {
					zoom(level)
				} else {
					console.warn('缩放等级已超出配置的最大范围')
				}
			},
			setData: (data) => {
				defaultOptions.data = Object.assign({}, defaultOptions.data, data)
				let layoutDataNew = dagreData.layout(defaultOptions)
				rerender(layoutDataNew)
			}
		}
	}
}

const createInnerDom = (dom, height = '100%', width = '100%') => {
	let div = document.createElement('div')
	div.id = 'three-container'
	div.style.width = width
	div.style.height = height
	div.style.zIndex = '-1'
	dom.appendChild(div)
}