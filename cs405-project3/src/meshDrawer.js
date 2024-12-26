/**
 * @class MeshDrawer
 * @description Helper class for rendering meshes with lighting effects.
 */
class MeshDrawer {
    constructor(isLightSource = false) {
        // Initialize shader program
        this.program = InitShaderProgram(meshVertexShader, meshFragmentShader);

        // Attribute locations
        this.positionLocation = gl.getAttribLocation(this.program, 'position');
        this.normalLocation = gl.getAttribLocation(this.program, 'normal');
        this.texCoordLocation = gl.getAttribLocation(this.program, 'texCoord');

        // Uniform locations for vertex shader
        this.mvpMatrixLocation = gl.getUniformLocation(this.program, 'mvp');
        this.modelViewMatrixLocation = gl.getUniformLocation(this.program, 'mv');
        this.normalMatrixLocation = gl.getUniformLocation(this.program, 'normalMV');
        this.modelMatrixLocation = gl.getUniformLocation(this.program, 'modelMatrix');

        // Uniform locations for fragment shader
        this.isLightSourceLocation = gl.getUniformLocation(this.program, 'isLightSource');
        this.textureSamplerLocation = gl.getUniformLocation(this.program, 'tex');

        // Buffers for mesh data
        this.positionBuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();
        this.texCoordBuffer = gl.createBuffer();

        this.texture = gl.createTexture();

        this.triangleCount = 0;
        this.isLightSource = isLightSource;
    }

    setMesh(positions, texCoords, normals) {
        // Set up position buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        // Set up normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

        // Set up texture coordinate buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        this.triangleCount = positions.length / 3;
    }

    draw(mvpMatrix, modelViewMatrix, normalMatrix, modelMatrix) {
        gl.useProgram(this.program);

        // Bind texture and set uniforms
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniformMatrix4fv(this.mvpMatrixLocation, false, mvpMatrix);
        gl.uniformMatrix4fv(this.modelViewMatrixLocation, false, modelViewMatrix);
        gl.uniformMatrix4fv(this.normalMatrixLocation, false, normalMatrix);
        gl.uniformMatrix4fv(this.modelMatrixLocation, false, modelMatrix);
        gl.uniform1i(this.isLightSourceLocation, this.isLightSource);

        // Configure vertex attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(this.positionLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.positionLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(this.normalLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.normalLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(this.texCoordLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.texCoordLocation);

        gl.drawArrays(gl.TRIANGLES, 0, this.triangleCount);
    }

    setTexture(image) {
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }

        gl.useProgram(this.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.textureSamplerLocation, 0);
    }
}

const meshVertexShader = `
precision mediump float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 texCoord;

uniform mat4 mvp;
uniform mat4 mv;
uniform mat4 normalMV;
uniform mat4 modelMatrix;

varying vec3 interpolatedNormal;
varying vec3 fragPosition;
varying vec2 interpolatedTexCoord;

void main() {
    interpolatedNormal = vec3(normalMV * vec4(normal, 0.0));
    fragPosition = vec3(modelMatrix * vec4(position, 1.0));
    interpolatedTexCoord = texCoord;
    gl_Position = mvp * vec4(position, 1.0);
}
`;

const meshFragmentShader = `
precision mediump float;

varying vec3 interpolatedNormal;
varying vec3 fragPosition;
varying vec2 interpolatedTexCoord;

uniform sampler2D tex;
uniform bool isLightSource;

void main() {
    vec3 normalizedNormal = normalize(interpolatedNormal);
    vec3 lightPosition = vec3(0.0, 0.0, 5.0);
    vec3 lightDirection = normalize(lightPosition - fragPosition);

    float ambientStrength = 0.35;
    float diffuseStrength = max(dot(normalizedNormal, lightDirection), 0.0) * 0.7;
    float phongExponent = 8.0;
    float specularStrength = 0.5;

    vec3 viewDirection = normalize(vec3(0.0, 0.0, -1.0) - fragPosition);
    vec3 reflectDirection = reflect(-lightDirection, normalizedNormal);
    float specular = pow(max(dot(viewDirection, reflectDirection), 0.0), phongExponent) * specularStrength;

    vec3 ambient = vec3(ambientStrength);
    vec3 diffuse = vec3(diffuseStrength);
    vec3 finalColor = ambient + diffuse + specular;

    if (isLightSource) {
        gl_FragColor = texture2D(tex, interpolatedTexCoord) * vec4(1.0);
    } else {
        gl_FragColor = texture2D(tex, interpolatedTexCoord) * vec4(finalColor, 1.0);
    }
}
`;
