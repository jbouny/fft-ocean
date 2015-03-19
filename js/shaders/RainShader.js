/**
 * @author jbouny / https://github.com/fft-ocean
 */
 
THREE.ShaderLib['rain'] = {

	uniforms: {
    texture: { type: 't', value: null }
  },
  
	vertexShader: [
    'attribute vec3 color;',

    'varying vec3 vColor;',

    'void main() {',
    '  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',

    '  vColor = color;',

    '  gl_PointSize = 50.0 * abs( modelViewMatrix[1].y );',
    '  gl_Position = projectionMatrix * mvPosition;',
    '}'
	].join( '\n' ),
  
	fragmentShader: [
    'uniform sampler2D texture;',

    'varying vec3 vColor;',

    'void main() {',
    '  vec4 startColor = vec4( vColor, 1.0 );',
    '  vec4 finalColor;',
    '  gl_FragColor = texture2D( texture, gl_PointCoord );',
    '}'
	].join( '\n' )
  
};