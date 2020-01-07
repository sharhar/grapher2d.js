//sin(x) + cos(y) = tan(y) - sec(x)*(sin(t*2)^2 + 0.1)

function gpInitCanvas(canvas, bounds) {
	var gl = canvas.getContext("webgl2");

	if(!gl) {
		console.log("Failed to get the rendering context for WebGL 2! Defaulting to WebGL 1.");

		gl = WebGLUtils.setupWebGL(canvas);
		if(!gl) {
			console.log("Failed to get the rendering context for WebGL 1!");
			return;
		}
	} else {
		var ext = gl.getExtension('EXT_color_buffer_float');
		if (!ext) {
			console.log("cannot render to float");
		}
	}


	console.log(gl.getSupportedExtensions());
	console.log(gl.getParameter(gl.VERSION));

	canvas.onmousemove = gpInternal_mouseMoveCallback;
	canvas.onwheel = gpInternal_mouseWheelCallback;

	gpInternal_initGridNumbers(gl);

	canvas.gpgl = gl;	

	gl.g_left = bounds[0];
	gl.g_down = bounds[1];
	gl.g_right = bounds[2];
	gl.g_up = bounds[3];
	gl.viewportWidth = canvas.width;
	gl.viewportHeight = canvas.height;

	gl.ZOOM_PERCENT = 0.025

	gl.preMouseX = 0;
	gl.preMouseY = 0;
	gl.preMouseDown = 0;

	gpInternal_createGridShader(gl);
    gpInternal_createQuadShader(gl);

	var equationString = gpInternal_eqConvert("sin(x)");

    gpInternal_createCalcShader(gl, equationString.body, equationString.funcs);
    gpInternal_createEdgeShader(gl, 600, 600);
    gpInternal_createRenderShader(gl, 600, 600);

    gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.dfbo_tex = gl.createTexture();
  	gl.bindTexture(gl.TEXTURE_2D, gl.dfbo_tex);
  	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 600, 600, 0, gl.RGBA, gl.FLOAT, null);
  	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.dfbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, gl.dfbo);  
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, gl.dfbo_tex, 0);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	gl.efbo_tex = gl.createTexture();
  	gl.bindTexture(gl.TEXTURE_2D, gl.efbo_tex);
  	gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 600, 600, 0, gl.RED, gl.UNSIGNED_BYTE, null);
  	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.efbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, gl.efbo);  
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, gl.efbo_tex, 0);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    var quad_data = new Array(12);

    quad_data[0] = -1;
	quad_data[1] = -1;

	quad_data[2] = 1;
	quad_data[3] = -1;

	quad_data[4] = 1;
	quad_data[5] = 1;

	quad_data[6] = -1;
	quad_data[7] = -1;

	quad_data[8] = -1;
	quad_data[9] = 1;

	quad_data[10] = 1;
	quad_data[11] = 1;  

    gl.vbo_quad = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, gl.vbo_quad);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad_data), gl.STATIC_DRAW);

	gl.vbo_quad.itemSize = 2;
	gl.vbo_quad.numItems = quad_data.length/2;

	var id_data = new Array(gl.viewportWidth);

	for(var i = 0; i < gl.viewportWidth; i++) {
		id_data[i] = i;
	}

	gl.line_ids = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, gl.line_ids);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(id_data), gl.STATIC_DRAW);

	gl.line_ids.numItems = gl.viewportWidth;

	gl.implicit = true;

	gpInternal_startGameLoop(gl);

	return gl;
}

function gpGraph(gl, func) {
	var equationString = gpInternal_eqConvert(func);
	gl.implicit = func.includes("=");

	if(equationString.error) {
		alert(equationString.error);
		return;
	}

	var vsh = gl.shader_calc.vsh;
	var fsh = gl.shader_calc.fsh;
	gl.deleteProgram(gl.shader_calc);
	gl.deleteShader(vsh);
	gl.deleteShader(fsh);

	if(gl.implicit) {
    	gpInternal_createCalcShader(gl, equationString.body, equationString.funcs);
	} else {
		gpInternal_createVertCalcShader(gl, equationString.body, equationString.funcs);
	}

    gl.time = new Date().getTime();
    gl.start_time = gl.time;
    gl.frame = 0;
}

function gpInternal_startGameLoop(gl) {
	function render_rec() {
		window.requestAnimFrame(render_rec, canvas);

		gl.current_time = new Date().getTime();
		gl.frame++;

		if(gl.current_time-gl.start_time > 1000) {
			console.log(gl.frame);
			gl.frame = 0;
			gl.start_time = gl.current_time;
		}

		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

		gl.clearColor(1.0, 1.0, 1.0, 1.0);

		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.bindBuffer(gl.ARRAY_BUFFER, gl.vbo_quad);

		gl.enableVertexAttribArray(gl.shader_grid.vpa);
		gl.useProgram(gl.shader_grid);
		
		gl.vertexAttribPointer(gl.shader_grid.vpa, gl.vbo_quad.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.uniform2f(gl.shader_grid.screenLoc, 600, 600);
		gl.uniform3f(gl.shader_grid.colorLoc, 0.45, 0.45, 0.45);
		gpInternal_drawGrid(gl);

		if(gl.implicit) {
			gl.bindFramebuffer(gl.FRAMEBUFFER, gl.dfbo);

			gl.clearColor(1.0, 1.0, 1.0, 0.0);
			gl.clear(gl.COLOR_BUFFER_BIT);

			gl.enableVertexAttribArray(gl.shader_calc.vpa);
			gl.useProgram(gl.shader_calc);

			gl.vertexAttribPointer(gl.shader_calc.vpa, gl.vbo_quad.itemSize, gl.FLOAT, false, 0, 0);

			gl.uniform1f(gl.shader_calc.upLoc, gl.g_up);
			gl.uniform1f(gl.shader_calc.downLoc, gl.g_down);
			gl.uniform1f(gl.shader_calc.leftLoc, gl.g_left);
			gl.uniform1f(gl.shader_calc.rightLoc, gl.g_right);
			gl.uniform1f(gl.shader_calc.timeLoc, (gl.current_time - gl.time)/1000.0);

			gl.drawArrays(gl.TRIANGLES, 0, 6);

			gl.bindFramebuffer(gl.FRAMEBUFFER, gl.efbo);

			gl.clearColor(0.0, 0.0, 0.0, 1.0);
			gl.clear(gl.COLOR_BUFFER_BIT);

			gl.enableVertexAttribArray(gl.shader_edge.vpa);
			gl.useProgram(gl.shader_edge);

			gl.uniform1i(gl.shader_edge.dataLoc, 0);

			gl.vertexAttribPointer(gl.shader_edge.vpa, gl.vbo_quad.itemSize, gl.FLOAT, false, 0, 0);

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, gl.dfbo_tex);

			gl.drawArrays(gl.TRIANGLES, 0, 6);

			gl.bindFramebuffer(gl.FRAMEBUFFER, null);

			gl.enableVertexAttribArray(gl.shader_render.vpa);
			gl.useProgram(gl.shader_render);

			gl.uniform1i(gl.shader_render.edgeLoc, 0);
			gl.uniform3f(gl.shader_render.colorLoc, 0.8, 0.2, 0.2);

			gl.vertexAttribPointer(gl.shader_render.vpa, gl.vbo_quad.itemSize, gl.FLOAT, false, 0, 0);

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, gl.efbo_tex);

			gl.drawArrays(gl.TRIANGLES, 0, 6);
		} else {
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);

			gl.bindBuffer(gl.ARRAY_BUFFER, gl.line_ids);

			gl.enableVertexAttribArray(gl.shader_calc.vpa);
			gl.useProgram(gl.shader_calc);

			gl.vertexAttribPointer(gl.shader_calc.vpa, 1, gl.FLOAT, false, 0, 0);

			gl.uniform1f(gl.shader_calc.upLoc, gl.g_up);
			gl.uniform1f(gl.shader_calc.downLoc, gl.g_down);
			gl.uniform1f(gl.shader_calc.leftLoc, gl.g_left);
			gl.uniform1f(gl.shader_calc.rightLoc, gl.g_right);
			gl.uniform1f(gl.shader_calc.timeLoc, (gl.current_time - gl.time)/1000.0);

			gl.drawArrays(gl.LINE_STRIP, 0, gl.line_ids.numItems);
		}
	}

	render_rec();
}

function gpInternal_getShader(gl, str, type) {
      var shader = gl.createShader(type);

      gl.shaderSource(shader, str);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          alert(gl.getShaderInfoLog(shader));
          return null;
      }

      return shader;
}
