"use strict";

/**
 * Cloud shader by @blurspline / http://github.com/zz85
 * Refactored by @jbouny
 */

THREE.ShaderLib['cloud'] = {
	uniforms: {
		'texture': { type: 't', value: null},
		'time': { type: 'f', value: 1 },
		'sharp': { type: 'f', value: 0.9 },
		'cover': { type: 'f', value: 0.5 },
		'clouds': { type: 'f', value: 1 },
		'depth': { type: 'f', value: 0 }
	},
	vertexShader: [
		'uniform sampler2D texture;',
		'uniform float time;',
		'varying vec2 vUv;',
		
		'void main()',
		'{',
			'vUv = uv;',
		'	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
		'}'
	].join('\n'),
	fragmentShader: [
		// Cloud shader by @blurspline / http://github.com/zz85
		// uses a simple fractal noise used a generated value-noise texture

		// references
		// 1. value noise
		// 2. iq clouds
		// 3. cloud papers
		'uniform float time;',

		'uniform float depth;',
		'uniform float sharp;', // magnify the intensity of clouds
		// 1 = dull ( more clouds), 0 = fuzzy ( less clouds)
		'uniform float cover;', // 0 = less clouds, 1 = more clouds
							// substraction factor
		'uniform float clouds;', // opacity
		'uniform sampler2D texture;',
		'varying vec2 vUv;',

		// multi-chanel noise lookup
		'vec3 noise3(vec2 p) {',
		'	return texture2D(texture, p).xyz;',
		'}',

		'vec3 fNoise(vec2 uv) {',
		'	vec3 f = vec3(0.);',
		'	float scale = 1.;',
		'	for (int i=0; i<5; i++) {',
		'		scale *= 2.;',
		'		f += noise3(uv * scale) / scale;',
		'	}',
		'	return f;',
		'}',

		'void main(void)',
		'{',
		'	vec2 uv = vUv;',
			
			// Formula: varience (smaller -> bigger cover) + speed (time) * direction
			// normal thick clouds
		'	vec3 ff1 = fNoise(uv * 0.01 + time * 0.00015 * vec2(-1., 1.));',

			// fast small clouds
		'	vec3 ff2 = fNoise(uv * 0.1 + time * 0.0005 * vec2(1., 1.));',
			
			// Different combinations of mixing
		'	float t = ff1.x * 0.9 + ff1.y * 0.15;',
		'	t = t * 0.99 + ff2.x * 0.01;',

		'	float o = clamp ( length(uv * 2.0 - vec2(1., 1.)), 0., 1. );',
			
			// applies more transparency to horizon for 
			// to create illusion of distant clouds
		'	o =  1. - o * o * o * o;',

			// multiply by more cloud transparency
		'	o -= (1. - t) * 0.95;', // factor clouds opacity based on cloud cover
			// 1 t = 1 o
			// depending on where this is placed, it will affect darkness / opacity of clouds
		'	t = max(t - (1. - cover), 0.);', // low cut off point
			// magnify or add layers!
			// cloud power magnifer
		'	t = 1. - pow(1. - sharp, t);', // . 0.999999 (response curve from linear to exponiential brigtness)
		'	t = min(t * 1.9, 1.0);', // clamp to 1.0

			// Other effects

		'	if (depth > 0.) {',
				// tweak thresholds
		'		if (o < 0.4 && t < 0.8) discard;',

		'		gl_FragData[ 0 ] = vec4(gl_FragCoord.z, 1., 1., 1.);',
		'	}',
		'	else {',
		'		gl_FragData[ 0 ] = vec4(t, t, t, o );',

		'	}',			
		'}'
	].join('\n')
};

function CloudShader( renderer, noiseSize ) {

	noiseSize = noiseSize || 256;
	
	var cloudShader = THREE.ShaderLib['cloud'] ;

	// Generate random noise texture
	var size = noiseSize * noiseSize;
	var data = new Uint8Array( 4 * size );

	for ( var i = 0; i < size * 4; i ++ ) {
		data[ i ] = Math.random() * 255 | 0;
	}

	var dt = new THREE.DataTexture( data, noiseSize, noiseSize, THREE.RGBAFormat );
	dt.wrapS = THREE.RepeatWrapping;
	dt.wrapT = THREE.RepeatWrapping;
	dt.magFilter = THREE.LinearFilter;
	dt.minFilter = THREE.LinearFilter;
	dt.needsUpdate = true;
	
	cloudShader.uniforms.texture.value = dt;

	var noiseMaterial = new THREE.ShaderMaterial({
		vertexShader: cloudShader.vertexShader,
		fragmentShader: cloudShader.fragmentShader,
		uniforms: cloudShader.uniforms,
		side: THREE.DoubleSide,
		transparent: true
	});

	this.noiseMaterial = noiseMaterial;

	var scamera, sscene, smesh;

	scamera = new THREE.Camera();

	scamera.position.z = 1;

	sscene = new THREE.Scene();

	smesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), noiseMaterial );

	sscene.add(smesh);

	function SkyDome(i, j) {
		i -= 0.5;
		j -= 0.5;

		var r2 = i * i * 4 + j * j * 4;
		var scale = 100000;

		return new THREE.Vector3(
			i * 20 * scale,
			(1 - r2) * 5 * scale,
			j * 20 * scale
		).multiplyScalar(0.05);

	};

	this.cloudMesh = new THREE.Mesh( 
		new THREE.ParametricGeometry(SkyDome, 5, 5),
		noiseMaterial
	);

	var performance = window.performance || Date;

	function update() {
		noiseMaterial.uniforms.time.value = performance.now() / 1000;
	}
	this.update = update;

	this.depthOnly = function(v) {
		noiseMaterial.uniforms.depth.value = v ? 1 : 0;
	};

}
