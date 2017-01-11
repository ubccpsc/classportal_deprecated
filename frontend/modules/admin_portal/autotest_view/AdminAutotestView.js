import React from 'react'
import ContentModule from '../../shared_components/ContentModule'


export default React.createClass({
  render: function () {
    return (
		<ContentModule id="admin-autotest-module" title={"Autotest"} initialHideContent={false}>
			<h2>CPSC 310 AutoTest Status</h2>

			<div style="display: none;">
				Last Run Only:
				<input id='optLast' type="checkbox" name="lastOnly" value="true" onchange="filterChange();"/>

					Deliverable:
					<select id='optDeliv' name="deliverable" onchange="filterChange();">
						<option value="all">All</option>
						<option value="d0">D0</option>
						<option value="d1">D1</option>
						<option value="d2">D2</option>
						<option value="d3">D3</option>
						<option value="d4">D4</option>
						<option value="d5">D5</option>
					</select>
			</div>

			<br/>

			<div id="myTableDiv" style="width: 100%;"></div>

			<div>
				<h2>Population Statistics</h2>
				<span><b>Average</b> <span id="bucketAvg"></span></span><br/><br/>
				<span>00-10% <span id="bucket0"></span></span><br/>
				<span>10-20% <span id="bucket1"></span></span><br/>
				<span>20-30% <span id="bucket2"></span></span><br/>
				<span>30-40% <span id="bucket3"></span></span><br/>
				<span>40-50% <span id="bucket4"></span></span><br/>
				<span>50-60% <span id="bucket5"></span></span><br/>
				<span>60-70% <span id="bucket6"></span></span><br/>
				<span>70-80% <span id="bucket7"></span></span><br/>
				<span>80-90% <span id="bucket8"></span></span><br/>
				<span>90-100% <span id="bucket9"></span></span><br/>
			</div>
	    </ContentModule>
    )
  }
})