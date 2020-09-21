import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { DagreGraphComponent, dagreGraphInit } from './modules/index'

class Index extends Component {
	constructor(props) {
		super(props)
		this.config = {
			zoom: 0.15,
			minZoom: 0.01,
			maxZoom: 1.5,
			height: '700px',
			width: '900px',
			layoutConfig: {},
			theme: {
				mainNode: '#FFFFFF',
				mainBkg: '#658FFC',

				activeNode: '#658FFC',
				activeBkg: '#EFF3FF',

				staticNode: '#3ECEB4',
				staticBkg: '#EFFFFC',

				senceBackground: '#FAFAFA',
				edgeColor: "#CACFD2"
			},
			data: {
				mainNode: 'rpt_dmetadata_tb_da',
				nodes: [
					{ label: 'DG-表Dmeta信息', id: 'dw_dg_tec_tbl_dmeta_da' },
					{ label: '人店中台-基础明细-经纪人-经纪人明细表', id: 'olap_shh_agent_personnel_base_da' },
					{ label: '管理平台DB表', id: 'stg_dmetadata_tb_db' },
					{ label: '元数据表基本信息', id: 'rpt_dmetadata_tb_da' },
					{ label: 'hive表各分区大小信息', id: 'ods_hive_table_partiton_pt_da' },
					{ label: '大数据权限系统角色权限表', id: 'rpt_bigdata_role_auth_da' },
					{ label: '大数据权限系统员工申请权限表', id: 'rpt_bigdata_employee_auth_da' },
					{ label: 'Hive表Adhoc使用热度明细基础', id: 'rpt_hive_tb_adhoc_query_da' },
					{ label: '资产管理_数据表_表查询明细表', id: 'rpt_am_table_table_query_detail_da' },
					{ label: 'ADHOC热门应用Hive表动态月排行表', id: 'olap_bigdata_adhoc_table_rank_di' },
					{ label: '数据应用组权限开放清单', id: 'rpt_shh_property_auth_list_da' },
				],

				edges: [
					{ source: 'dw_dg_tec_tbl_dmeta_da', target: 'rpt_dmetadata_tb_da' },
					{ source: 'olap_shh_agent_personnel_base_da', target: 'rpt_dmetadata_tb_da' },
					{ source: 'stg_dmetadata_tb_db', target: 'rpt_dmetadata_tb_da' },
					{ source: 'ods_hive_table_partiton_pt_da', target: 'rpt_dmetadata_tb_da' },
					{ source: 'rpt_dmetadata_tb_da', target: 'rpt_bigdata_role_auth_da' },
					{ source: 'rpt_dmetadata_tb_da', target: 'rpt_bigdata_employee_auth_da' },
					{ source: 'rpt_dmetadata_tb_da', target: 'rpt_hive_tb_adhoc_query_da' },
					{ source: 'rpt_hive_tb_adhoc_query_da', target: 'rpt_am_table_table_query_detail_da' },
					{ source: 'rpt_bigdata_employee_auth_da', target: 'olap_bigdata_adhoc_table_rank_di' },
					{ source: 'rpt_bigdata_employee_auth_da', target: 'rpt_shh_property_auth_list_da' },
				]
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
			onEmptyClick: (e) => {
				console.log('空白点击')
			},
			onNodeRightClick: ({ x, y, node }) => {
				console.log('当前右键点击节点', x, y, node)
			},
			onEmptyRightClick: (e) => {
				console.log('空白右键点击')
			}
		}
	}

	render() {
		const btnStyle = { marginLeft: '10px' }
		return (
			<React.Fragment>
				<DagreGraphComponent {...this.config} onInit={(graph) => this.graph = graph} />
				<button onClick={() => this.graph.reset()}>重置</button>
				<button style={btnStyle} onClick={() => {
					let currentZoom = this.graph.zoom()
					this.graph.zoom(currentZoom - 0.1)
				}}>缩小</button>
				<button style={btnStyle} onClick={() => {
					let currentZoom = this.graph.zoom()
					this.graph.zoom(currentZoom + 0.1)
				}}>放大</button>
				<button style={btnStyle} onClick={() => this.graph.focus('rpt_bigdata_employee_auth_da')}>聚焦到（大数据权限系统员工申请权限表）</button>
				<button style={btnStyle} onClick={() => {
					let nodes = this.graph.findRelateNodes('rpt_bigdata_employee_auth_da')
					console.log(nodes)
					this.graph.activeTargetNodes(nodes.map(node => node.nodeInfo.id))
				}}>查找（大数据权限系统员工申请权限表）关联节点，并高亮</button>
			</React.Fragment>
		)
	}
}

ReactDOM.render(<Index />, document.getElementById('root'))
