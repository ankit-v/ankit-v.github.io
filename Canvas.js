var canvas = null;
var gl = null;
var bFullscreen = false;

const webGLMacros =
{
    AMV_ATTRIBUTE_POSITION: 0,
    AMV_ATTRIBUTE_COLOR: 1,
    AMV_ATTRIBUTE_NORMAL: 2,
    AMV_ATTRIBUTE_TEXTURE0: 3
}
var shaderProgramObject;
var vao;
var vbo_position;
var vbo_color;
var mvpMatrixUniform;
var perspectiveProjectionMatrix;

var requestAnimationFrame = window.requestAnimationFrame ||         // Chrome
                            window.mozRequestAnimationFrame ||      // Mozilla
                            window.webkitRequestAnimationFrame ||   // Safari
                            window.oRequestAnimationFrame ||        // Opera
                            window.msRequestAnimationFrame;         // Edge

function main()
{
    // Code
    // Get canvas
    canvas = document.getElementById("AMV");
    if (!canvas)
        console.error("Failed to obtain canvas");
    else
        console.log("Successfully obtained canvas");

    // Backup canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize
    initialize();

    // Resize (warmup resize)
    resize();

    // Display
    display();

    // Add keyboard and mouse event listeners
    window.addEventListener("keydown", keyDown, false);  
    window.addEventListener("click", mouseDown, false);
    window.addEventListener("resize", resize, false);
}

function toggleFullscreen()
{
    // Code
    var fullscreen_element = document.fullscreenElement ||             // chrome/opera
                            document.mozFullScreenElement ||           // mozilla
                            document.webkitFullsceenElement ||         // safari
                            document.msFullscreenElement ||            // ie/edge
                            null;

    if (fullscreen_element == null)                                
    {
        if (canvas.requestFullscreen)                              
            canvas.requestFullscreen();
        else if (canvas.mozRequestFullScreen)
            canvas.mozRequestFullScreen();
        else if (canvas.webkitRequestFulScreen) 
            canvas.webkitRequestFulScreen();  
        else if (canvas.msRequestFullscreen)
            canvas.msRequestFullscreen();
    }
    else
    {
        if (document.exitFullscreen)
            document.exitFullscreen();
        else if (document.mozExitFullScreen)
            document.mozExitFullScreen();
        else if (document.webkitExitFullscreen)
            document.webkitExitFullscreen();
        else if (document.msExitFullscreen)
            document.msExitFullscreen();
    }
}

function initialize()
{
    // code
    // Get Web 2.0 context from canvas
    gl = canvas.getContext("webgl2");       
    if (!gl)
        console.error("Failed to obtain WebGL 2.0 context");
    else
        console.log("Successfully obtained WebGL 2.0 context");

    // Set viewport width and height of context
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;

    // vertex shader
    var vertexShaderSourceCode =
        "#version 300 es" +
        "\n" +
        "in vec4 a_position;" +
        "in vec4 a_color;" +
        "uniform mat4 u_mvpMatrix;" +
        "out vec4 a_color_out;" +
        "void main(void)" +
        "{" +
            "gl_Position = u_mvpMatrix * a_position;" +
            "a_color_out = a_color;" +
        "}";

    var vertexShaderObject = gl.createShader(gl.VERTEX_SHADER);

    gl.shaderSource(vertexShaderObject, vertexShaderSourceCode);
    gl.compileShader(vertexShaderObject);
    if (gl.getShaderParameter(vertexShaderObject, gl.COMPILE_STATUS) == false)
    {
        var error = gl.getShaderInfoLog(vertexShaderObject);
        if (error.length > 0) {
            alert("Vertex Shader Compilation log: \n"+error);
            uninitialize();
        }
    }

    // fragment shader
    var fragmentShaderSourceCode =
        "#version 300 es" +
        "\n" +
        "precision highp float;" +
        "in vec4 a_color_out;" +
        "out vec4 FragColor;" +
        "void main(void)" +
        "{" +
            "FragColor = a_color_out;" +
        "}";

    var fragmentShaderObject = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(fragmentShaderObject, fragmentShaderSourceCode);
    gl.compileShader(fragmentShaderObject);
    if (gl.getShaderParameter(fragmentShaderObject, gl.COMPILE_STATUS) == false) {
        var error = gl.getShaderInfoLog(fragmentShaderObject);
        if (error.length > 0) {
            alert("Fragment Shader Compilation log: \n" + error);
            uninitialize();
        }
    }

    // shader program
    shaderProgramObject = gl.createProgram();
    gl.attachShader(shaderProgramObject, vertexShaderObject);
    gl.attachShader(shaderProgramObject, fragmentShaderObject);

    // pre linking
    gl.bindAttribLocation(shaderProgramObject, webGLMacros.AMV_ATTRIBUTE_POSITION, "a_position");
    gl.bindAttribLocation(shaderProgramObject, webGLMacros.AMV_ATTRIBUTE_COLOR, "a_color");

    // linking
    gl.linkProgram(shaderProgramObject);
    if (gl.getProgramParameter(shaderProgramObject, gl.LINK_STATUS) == false) {
        var error = gl.getProgramInfoLog(shaderProgramObject);
        if (error.length > 0) {
            alert("Shader Program link log: \n" +error);
            uninitialize();
        }
    }

    // post linking
    mvpMatrixUniform = gl.getUniformLocation(shaderProgramObject, "u_mvpMatrix");

    var triangleVertices = new Float32Array([
        0.0, 1.0, 0.0,
        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0
    ]);

    var triangleColor = new Float32Array([
        1.0, 0.0, 0.0,  // Red
        0.0, 1.0, 0.0,  // Green
        0.0, 0.0, 1.0   // Blue
    ])

    // vao
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // vbo position
    vbo_position = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo_position);
    gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(webGLMacros.AMV_ATTRIBUTE_POSITION, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(webGLMacros.AMV_ATTRIBUTE_POSITION);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
   
    // vbo color
    vbo_color = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo_color);
    gl.bufferData(gl.ARRAY_BUFFER, triangleColor, gl.STATIC_DRAW);
    gl.vertexAttribPointer(webGLMacros.AMV_ATTRIBUTE_COLOR, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(webGLMacros.AMV_ATTRIBUTE_COLOR);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);

    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    perspectiveProjectionMatrix = mat4.create();
}

function resize()
{
    if (canvas.height == 0)
        canvas.height = 1; 

    gl.viewport(0, 0, canvas.width, canvas.height);
    mat4.perspective(perspectiveProjectionMatrix, 45.0, parseFloat(canvas.width) / parseFloat(canvas.height), 0.1, 100.0);
}

function display()
{
    // code
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(shaderProgramObject);

    // transformation
    var translationMatrix = mat4.create();
    var modelViewMatrix = mat4.create();
    var modelViewProjectionMatrix = mat4.create();

    mat4.translate(translationMatrix, translationMatrix, [0.0, 0.0, -3.0]);
    modelViewMatrix = translationMatrix;

    mat4.multiply(modelViewProjectionMatrix, perspectiveProjectionMatrix, modelViewMatrix);
    gl.uniformMatrix4fv(mvpMatrixUniform, false, modelViewProjectionMatrix);

    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);

    gl.useProgram(null);

    // Double buffer emulation
    requestAnimationFrame(display, canvas);

}

function update()
{
    // code

}

// Keyboard event listener
function keyDown(event)
{
    // code
    switch (event.keyCode)
    {
        case 69:
            uninitialize();
            window.close();     
            break;
        case 70:
            toggleFullscreen();
            break;
    }
}

// Mouse event listener
function mouseDown()
{
    // code
   
}

function uninitialize()
{
    // code
    if (vao) {
        gl.deleteVertexArray(vao);
        vao = null;
    }
    if (vbo_color) {
        gl.deleteBuffer(vbo_color);
        vbo_color = null;
    }
    if (vbo_position) {
        gl.deleteBuffer(vbo_position);
        vbo_position = null;
    }
    if (shaderProgramObject > 0) {
        gl.useProgram(shaderProgramObject);

        var shaderObjects = gl.getAttachedShaders(shaderProgramObject);
        for (let i = 0; i < shaderObjects.length; i++) {
            gl.detachShader(shaderProgramObject, shaderObjects[i]);
            gl.deleteShader(shaderObjects[i]);
            shaderObjects[i] = null;
        }
        gl.useProgram(null);
        gl.deleteProgram(shaderProgramObject);
        shaderProgramObject = null;
    }

}