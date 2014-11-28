"use strict";

// Cloud shader by @blurspline / http://github.com/zz85

function CloudShader( renderer, noiseSize, cloudSize ) {

	noiseSize = noiseSize || 256;
	cloudSize = cloudSize || 512;

	var vertexShader = [
		'uniform sampler2D texture;',
		'uniform float time;',
		'varying vec2 vUv;',
		
		'void main()',
		'{',
			'vUv = uv;',
		'	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
		'}'
	].join('\n');

	var fragmentShader = [
		'precision highp float;',	
		'uniform float time;',
		'uniform sampler2D texture;',
		'void main()',
		'{',
		'	gl_FragColor = vec4( 1.0, 1.0, 1.0, 0.1 );',
		'}'
	].join('\n');

	fragmentShader = document.getElementById('cloudFragShader').textContent;

	// Generate random noise texture
	var size = noiseSize * noiseSize;
	var data = new Uint8Array( 4 * size );

	for ( var i = 0; i < size * 4; i ++ ) {
		data[ i ] = Math.random() * 255 | 0;
	}

	// for ( var i = 0; i < size; i++ ) {
	// 	if (i % 4 != 0) {
	// 		var j = (i / 4 | 0) * 4;
	// 	}
	// 	data[ i + 1 ] = data [ j + 1];
	// }

	var dt = new THREE.DataTexture( data, noiseSize, noiseSize, THREE.RGBAFormat );
	// dt.minFilter = THREE.NearestFilter;
	// dt.magFilter = THREE.NearestFilter;
	dt.wrapS = THREE.RepeatWrapping;
	dt.wrapT = THREE.RepeatWrapping;
	dt.needsUpdate = true;

	var uniforms = {
		texture: { type: 't', value: dt},
		resolution: { type: 'v2', value: new THREE.Vector2(cloudSize, cloudSize) },
		time: { type: 'f', value: 1 },
		sharp: { type: 'f', value: 0.9 },
		cover: { type: 'f', value: 0.5 },
		clouds: { type: 'f', value: 1 },
		depth: { type: 'f', value: 0 }
	};

	var noiseMaterial = new THREE.ShaderMaterial({
		vertexShader: vertexShader,
		fragmentShader: fragmentShader,
		uniforms: uniforms,
		// color: 0xff0000,
		// wireframe: !true,
		side: THREE.DoubleSide,
		transparent: true
	});

	this.noiseMaterial = noiseMaterial;

	var scamera, sscene, smesh, renderTarget;

	scamera = new THREE.Camera();

	scamera.position.z = 1;

	sscene = new THREE.Scene();

	smesh = new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ), noiseMaterial );

	sscene.add(smesh);

	renderTarget = new THREE.WebGLRenderTarget( cloudSize, cloudSize, {
		wrapS: THREE.RepeatWrapping,
		wrapT: THREE.RepeatWrapping,
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		format: THREE.RGBAFormat,
		type: THREE.FloatType,
		stencilBuffer: false
	} );

	function SkyDome(i, j) {
		i -= 0.5;
		j -= 0.5;

		var r2 = i * i * 4 + j * j * 4;

		return new THREE.Vector3(
			i * 20000,
			(1 - r2) * 5000,
			j * 20000
		).multiplyScalar(0.05);

	};

	var mesh = new THREE.Mesh( 

		new THREE.ParametricGeometry(SkyDome, 5, 5),
		// new THREE.MeshBasicMaterial({
		// 	// color: 0xff0000,
		// 	// wireframe: true,
		// 	side: THREE.DoubleSide,
		// 	transparent: true,
		// 	map: renderTarget
		// })
		noiseMaterial
	);

	var performance = window.performance || Date;

	function update() {

		noiseMaterial.uniforms.time.value = performance.now() / 1000;

		// renderer.render( sscene, scamera, renderTarget );

	}

	this.cloudMesh = mesh;
	this.update = update;

	this.depthOnly = function(v) {
		noiseMaterial.uniforms.depth.value = v ? 1 : 0;
	};

}
