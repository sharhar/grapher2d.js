function gpInternal_initGridNumbers(gl) {
    gl.textDiv = document.getElementById("test-div");
    gl.textPs = new Array(20);

    for(var i = 0; i < 20;i++) {
        gl.textPs[i] = document.createElement("div");
        gl.textDiv.appendChild(gl.textPs[i]);

        gl.textPs[i].style.position = "absolute";
        gl.textPs[i].style.left = "-100px";
        gl.textPs[i].style.top = "-100px";
    }
}

function gpInternal_createGridShader(gl) {
	var vs_src = `
		attribute vec2 pos;
		attribute vec2 texcoord;

        uniform vec2 screen;
        uniform vec4 trans;
		
		void main(void) {
			gl_Position = vec4(2.0*(pos.x*trans.z + trans.x)/screen.x - 1.0, 
                               2.0*(pos.y*trans.w + trans.y)/screen.y - 1.0, 0.0, 1.0);
		}`;

	var fs_src = `
		precision mediump float;

		uniform vec3 color;

		void main(void) {
			gl_FragColor = vec4(color.xyz, 1.0);
		}`;

	var vsh = gpInternal_getShader(gl, vs_src, gl.VERTEX_SHADER);
    var fsh = gpInternal_getShader(gl, fs_src, gl.FRAGMENT_SHADER);

	gl.shader_grid = gl.createProgram();

	gl.attachShader(gl.shader_grid, vsh);
    gl.attachShader(gl.shader_grid, fsh);
    gl.linkProgram(gl.shader_grid);

    if (!gl.getProgramParameter(gl.shader_grid, gl.LINK_STATUS)) {
      alert("Could not initialise shaders");
    }

    gl.useProgram(gl.shader_grid);

    gl.shader_grid.screenLoc = gl.getUniformLocation(gl.shader_grid, "screen");
    gl.shader_grid.transLoc = gl.getUniformLocation(gl.shader_grid, "trans");
    gl.shader_grid.colorLoc = gl.getUniformLocation(gl.shader_grid, "color");

    gl.shader_grid.vpa_pos = gl.getAttribLocation(gl.shader_grid, "pos");
}

function gpInternal_drawGrid(gl) {
    var l = Math.abs(gl.g_left);
    var r = Math.abs(gl.g_right);

    var xoff = (l / (r + l)) * gl.viewportWidth;

    var textXPos = xoff;

    if(gl.g_right < 0 && gl.g_left < 0) {
        textXPos = gl.viewportWidth+3;
    } else if (gl.g_right > 0 && gl.g_left > 0) {
        textXPos = 0;
    }

    var d = Math.abs(gl.g_down);
    var u = Math.abs(gl.g_up);

    var yoff = (d / (u + d))* gl.viewportHeight;

    var textYPos = gl.viewportHeight-yoff;

    if(gl.g_up < 0 && gl.g_down < 0) {
        textYPos = 0;
    } else if (gl.g_up > 0 && gl.g_down > 0) {
        textYPos = gl.viewportHeight;
    }

    var bounds = gl.canvas.getBoundingClientRect();
    var xratio = gl.viewportWidth / (gl.g_right - gl.g_left);

    var xlen = gl.g_right - gl.g_left;
    var xlog = Math.log10(xlen);
    var xfloor = Math.floor(xlog);
    var xmag = Math.pow(10, xfloor);

    if (Math.floor(xlog - 0.3) < xfloor) {
        xmag /= 2;
    }

    if (Math.floor(xlog - 0.6) < xfloor) {
        xmag /= 2;
    }

    var xlr = Math.round(gl.g_left / xmag)*xmag;
    var xrr = Math.round(gl.g_right / xmag)*xmag;

    var index = 0;

    var xNum = (xrr - xlr) / xmag;
    for (i = 0; i < xNum + 1;i++) {
        var tx = (xlr - gl.g_left + xmag*i)*xratio;
        var xrv = xlr + xmag*i;

        if (tx  < 0 || tx > gl.viewportWidth) {
            continue;
        }

        if (textYPos > gl.viewportHeight-14) {
            textYPos = gl.viewportHeight-14;
        }

        gl.textPs[index].style.left = tx+12 + "px";
        gl.textPs[index].style.top = textYPos+10 + "px";
        gl.textPs[index].innerHTML = "" + xrv;

        gl.uniform4f(gl.shader_grid.transLoc, tx, 300, 0.5, 600);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        index++;
    }

    var yratio = gl.viewportHeight / (gl.g_up - gl.g_down);

    var ylen = gl.g_up - gl.g_down;
    var ylog = Math.log10(ylen);
    var yfloor = Math.floor(ylog);
    var ymag = Math.pow(10, yfloor);

    if (Math.floor(ylog - 0.3) < yfloor) {
        ymag /= 2;
    }

    if (Math.floor(ylog - 0.6) < yfloor) {
        ymag /= 2;
    }

    var ylr = Math.round(gl.g_down / ymag)*ymag;
    var yrr = Math.round(gl.g_up / ymag)*ymag;

    var yNum = (yrr - ylr) / ymag;

    for (i = 0; i < yNum * 2; i++) {
        var ty = (ylr - gl.g_down + ymag*i)*yratio;
        var yrv = ylr + ymag*i;

        if (ty < 0 || ty > gl.viewportHeight) {
            continue;
        }

        gl.textPs[index].style.left = textXPos+12 + "px";
        gl.textPs[index].style.top = (bounds.bottom - ty-4) + "px";
        gl.textPs[index].innerHTML = "" + yrv;

        gl.uniform4f(gl.shader_grid.transLoc, 300, ty, 600, 0.5);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        index++;
    }

    for(var i = index; i < 20; i++) {
        gl.textPs[i].style.left = "-100px";
        gl.textPs[i].style.top = "-100px";
    }

    gl.uniform3f(gl.shader_grid.colorLoc, 0, 0, 0);

    if (gl.g_left < 0 && gl.g_right > 0) {
        gl.uniform4f(gl.shader_grid.transLoc, xoff, 300, 1, 600);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    if (gl.g_up > 0 && gl.g_down < 0) {
        gl.uniform4f(gl.shader_grid.transLoc, 300, yoff, 600, 1);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}