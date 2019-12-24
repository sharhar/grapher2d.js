
function gpInternal_mouseMoveCallback(e) {
	var gl = e.target.gpgl;

	var posx = e.clientX;
	var posy = e.clientY;

	var down = e.buttons&1;

	var bounds = e.target.getBoundingClientRect();

	posx -= bounds.left;
	posy -= bounds.top;

	if (gl.preMouseX != posx || gl.preMouseY != posy || gl.preMouseDown != down) {
		var dx = posx - gl.preMouseX;
		var dy = posy - gl.preMouseY;

		gl.preMouseX = posx;
		gl.preMouseY = posy;
		gl.preMouseDown = down;

		if ((dx != 0 || dy != 0) && down == 1) {
			var width = gl.g_right - gl.g_left;
			var percentX = dx / gl.viewportWidth;

			var moveX = -width * percentX;

			gl.g_left += moveX;
			gl.g_right += moveX;

			var height = gl.g_up - gl.g_down;
			var percentY = dy / gl.viewportHeight;

			var moveY = height * percentY;

			gl.g_down += moveY;
			gl.g_up += moveY;
		}
	}
}

function gpInternal_mouseWheelCallback(e) {
	var gl = e.target.gpgl;
	var scroll = -e.deltaY;

	var bounds = e.target.getBoundingClientRect();

	var x = e.clientX - bounds.left;
	var y = e.clientY - bounds.top;

	var x1 = 0;
	var y1 = 0;
	var x2 = gl.g_right - gl.g_left;
	var y2 = gl.g_up - gl.g_down;
			
	var w1 = (x / gl.viewportWidth)*x2;
	var w2 = x2 - w1;

	if (scroll > 0) {
		x1 = 2 * gl.ZOOM_PERCENT*w1;
		x2 = x2 - 2 * gl.ZOOM_PERCENT*w2;
	} else if (scroll < 0){
		x1 = - 2 * gl.ZOOM_PERCENT*w1;
		x2 = x2 + 2 * gl.ZOOM_PERCENT*w2;
	}

	var h1 = ((gl.viewportHeight - y) / gl.viewportHeight)*(y2);
	var h2 = y2 - ((gl.viewportHeight - y) / gl.viewportHeight)*(y2);

	if (scroll > 0) {
		y1 = 2 * gl.ZOOM_PERCENT*h1;
		y2 = y2 - 2 * gl.ZOOM_PERCENT*h2;
	}
	else if (scroll < 0) {
		y1 = -2 * gl.ZOOM_PERCENT*h1;
		y2 = y2 + 2 * gl.ZOOM_PERCENT*h2;
	}

	gl.g_right = gl.g_left + x2;
	gl.g_left = gl.g_left + x1;
	gl.g_up = gl.g_down + y2;
	gl.g_down = gl.g_down + y1;

	e.preventDefault();
}