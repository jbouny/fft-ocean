﻿/**
 * @author jbouny / https://github.com/fft-ocean
 */

var DEMO =
{
	ms_Renderer : null,
	ms_Camera : null,
	ms_Scene : null,
	ms_Controls : null,
	ms_Ocean : null,
	ms_Environment : "night",
	ms_Raining : false,

	ms_Commands : {
		states : {
			up : false,
			right : false,
			down : false,
			left : false
		},
		movements : {
			speed : 0.0,
			angle : 0.0
		}
	},

	Initialize : function () {

		this.ms_Renderer = new THREE.WebGLRenderer();
		this.ms_Renderer.context.getExtension( 'OES_texture_float' );
		this.ms_Renderer.context.getExtension( 'OES_texture_float_linear' );
		this.ms_Renderer.setClearColor( 0x000000 );

		document.body.appendChild( this.ms_Renderer.domElement );

		this.ms_Scene = new THREE.Scene();

		this.ms_GroupShip = new THREE.Object3D();
		this.ms_BlackPearlShip = new THREE.Object3D();
		this.ms_Scene.add( this.ms_GroupShip );
		this.ms_GroupShip.add( this.ms_BlackPearlShip );

		this.ms_Camera = new THREE.PerspectiveCamera( 55.0, WINDOW.ms_Width / WINDOW.ms_Height, 0.5, 1000000 );
		this.ms_Camera.position.set( 0, 350, 800 );
		this.ms_Camera.lookAt( new THREE.Vector3() );
		this.ms_BlackPearlShip.add( this.ms_Camera );

		// Initialize Orbit control
		this.ms_Controls = new THREE.OrbitControls( this.ms_Camera, this.ms_Renderer.domElement );
		this.ms_Controls.userPan = false;
		this.ms_Controls.target.set( 0, 100.0, 0 );
		this.ms_Controls.noKeys = true;
		this.ms_Controls.userPanSpeed = 0;
		this.ms_Controls.minDistance = 0;
		this.ms_Controls.maxDistance = 20000.0;
		this.ms_Controls.minPolarAngle = 0;
		this.ms_Controls.maxPolarAngle = Math.PI * 0.75;

		this.InitializeSound();
		this.InitializeLoader();
		this.InitializeScene();

		this.InitGui();
		this.InitCommands();

	},
	
	InitializeSound : function InitializeSound() {
		
		var initSound = function initSound( url ) {
		
			if ( window.HTMLAudioElement ) {
			
				var sound = new Audio('');

				if ( sound.canPlayType( 'audio/mp3' ) ) {
				
					var sound = new Audio( url );
					
					sound.addEventListener( 'ended', function() {
						this.currentTime = 0;
						this.play();
					}, false );
					
					return sound;
					
				}
				
			}
			
		};
		
		this.ms_soundWaves = initSound( 'sound/waves.mp3' );
		this.ms_soundRain = initSound( 'sound/rain.mp3' );
		
		if(!typeof this.ms_soundWaves === 'undefined') this.ms_soundWaves.play();
		else console.log('Sound disabled due to licensing');
		
	},
	
	InitializeLoader : function InitializeLoader() {
	
		this.ms_Loader = new THREE.LoadingManager();
		
		var log = function( message, type, timeout ) {
			console.log( message );
			messg( message, type, timeout );
		}
		
		var delay = 1500;
		this.ms_Loader.onProgress = function( item, loaded, total ) {
			log( 'Loaded ' + loaded + '/' + total + ':' + item, 'info', delay );
		};
		this.ms_Loader.onLoad = function () {
			log( 'Loaded.', 'success', delay );
		};
		this.ms_Loader.onError = function () {
			log( 'Loading error.', 'error', delay );
		};
		
		
		this.ms_ImageLoader = new THREE.ImageLoader( this.ms_Loader );
	
	},

	InitializeScene : function InitializeScene() {

		// Add light
		this.ms_MainDirectionalLight = new THREE.DirectionalLight( 0xffffff, 1.5 );
		this.ms_MainDirectionalLight.position.set( -0.2, 0.5, 1 );
		this.ms_Scene.add( this.ms_MainDirectionalLight );

		// Add Black Pearl
		var loader = new THREE.OBJMTLLoader( this.ms_Loader );
		this.ms_BlackPearl = null;
		loader.load( 'models/BlackPearl/BlackPearl.obj', 'models/BlackPearl/BlackPearl.mtl', function ( object ) {
			object.position.y = 20.0;
			if( object.children ) {
				for( child in object.children ) {
					object.children[child].material.side = THREE.DoubleSide;
				}
			}

			DEMO.ms_BlackPearlShip.add( object );
			DEMO.ms_BlackPearl = object;
		} );

		// Add rain
		{
			var size = 128;
			var rainTexture = new THREE.Texture();
			rainTexture.generateMipmaps = false;
			rainTexture.magFilter = THREE.LinearFilter;
			rainTexture.minFilter = THREE.LinearFilter;
			this.ms_ImageLoader.load( 'img/water-drop.png', function ( image ) {
					rainTexture.image = image;
					rainTexture.needsUpdate = true;
			} );

			var rainShader = THREE.ShaderLib['rain'];

			var rainMaterial = new THREE.ShaderMaterial({
				fragmentShader: rainShader.fragmentShader,
				vertexShader: rainShader.vertexShader,
				uniforms: rainShader.uniforms,
				transparent: true,
				depthWrite: false
			});
			rainMaterial.uniforms.texture.value = rainTexture;

			this.ms_RainGeometry = new THREE.Geometry();
			for ( i = 0; i < 100; i++ )
			{
				var vertex = new THREE.Vector3();
				vertex.x = Math.random() * 2.0 * size - size;
				vertex.y = Math.random() * 2.0 * size - size;
				vertex.z = Math.random() * size - size * 0.5;
				this.ms_RainGeometry.vertices.push( vertex );
			}
			this.ms_Rain = new THREE.Points( this.ms_RainGeometry, rainMaterial );
			this.ms_Camera.add( this.ms_Rain );
			this.ms_Rain.position.setZ( - size * 0.75 ) ;
		}

		// Initialize Clouds
		this.ms_CloudShader = new CloudShader( this.ms_Renderer, 512 );
		this.ms_CloudShader.cloudMesh.scale.multiplyScalar( 4.0 );
		this.ms_Scene.add( this.ms_CloudShader.cloudMesh );

		// Initialize Ocean
		var gsize = 512;
		var res = 512;
		var gres = 256;
		var origx = -gsize / 2;
		var origz = -gsize / 2;
		this.ms_Ocean = new THREE.Ocean( this.ms_Renderer, this.ms_Camera, this.ms_Scene,
		{
			INITIAL_SIZE : 200.0,
			INITIAL_WIND : [ 10.0, 10.0 ],
			INITIAL_CHOPPINESS : 3.6,
			CLEAR_COLOR : [ 1.0, 1.0, 1.0, 0.0 ],
			SUN_DIRECTION : this.ms_MainDirectionalLight.position.clone(),
			OCEAN_COLOR: new THREE.Vector3( 0.35, 0.4, 0.45 ),
			SKY_COLOR: new THREE.Vector3( 10.0, 13.0, 15.0 ),
			EXPOSURE : 0.15,
			GEOMETRY_RESOLUTION: gres,
			GEOMETRY_SIZE : gsize,
			RESOLUTION : res
		} );

		this.LoadSkyBox();
		this.LoadMountains();
	},

	InitGui : function InitGui() {

		// Initialize UI
		var gui = new dat.GUI();
		dat.GUI.toggleHide();

		gui.add( this.ms_Ocean, "size", 10, 2000 ).onChange( function( v ) {
			this.object.size = v;
			this.object.changed = true;
		} );
		gui.add( this.ms_Ocean.materialSpectrum.uniforms.u_choppiness, "value", 0.1, 8 ).name( "choppiness" );
		gui.add( this.ms_Ocean, "windX", -50, 50 ).onChange( function ( v ) {
			this.object.windX = v;
			this.object.changed = true;
		} );
		gui.add( this.ms_Ocean, "windY", -50, 50 ).onChange( function ( v ) {
			this.object.windY = v;
			this.object.changed = true;
		} );
		gui.add( this.ms_Ocean, "exposure", 0.0, 0.5 ).onChange( function ( v ) {
			this.object.exposure = v;
			this.object.changed = true;
		} );
		gui.add( DEMO.ms_Ocean.materialOcean, "wireframe" );

		var demo = this;

		$( '#env-selector > ul > li[key="' + this.ms_Environment + '"]' ).addClass( 'selected' );
		$( '#env-selector > ul > li' ).click( function() {
			demo.UpdateEnvironment( $( this ).attr('key') );

			$( '#env-selector > ul > li' ).removeClass( 'selected' );
			$( this ).addClass( 'selected' );
		} ).each( function() {
			$( this ).html( '<a href="#' + $( this ).attr('key') + '">' + $( this ).html() + '</a>' );
		} ) ;

	},

	InitCommands : function InitCommands() {

		var LEFT = 37,
			UP = 38,
			RIGHT = 39,
			DOWN = 40;

		var keyHandler = function keyHandler( action ) {
			return function( event ) {
				var key = event.which;
				if( key >= LEFT && key <= DOWN ) {
					switch( key ) {
						case UP : DEMO.ms_Commands.states.up = action ; break ;
						case RIGHT : DEMO.ms_Commands.states.right = action ; break ;
						case DOWN : DEMO.ms_Commands.states.down = action ; break ;
						case LEFT : DEMO.ms_Commands.states.left = action ; break ;
					}
				}
			}
		}

		$( document ).keydown( keyHandler( true ) );
		$( document ).keyup( keyHandler( false ) );

	},

	LoadMountains : function LoadSkyBox() {

		var demo = this;

		var mountainTexture = new THREE.Texture();
		mountainTexture.generateMipmaps = false;
		mountainTexture.magFilter = THREE.LinearFilter;
		mountainTexture.minFilter = THREE.LinearFilter;
		this.ms_ImageLoader.load( 'img/mountains.png', function ( image ) {
				mountainTexture.image = image;
				mountainTexture.needsUpdate = true;
		} );


		var mountainsMaterial = new THREE.MeshBasicMaterial( {
			map: mountainTexture,
			transparent: true,
			side: THREE.BackSide,
			depthWrite: false
		} );

		var addMountain = function addMountain( size ) {

			var moutains = new THREE.Mesh(
				new THREE.CylinderGeometry( size, size, 35000, 32, 1, true ),
				mountainsMaterial
			);
			moutains.position.y = 10000;
			demo.ms_Scene.add( moutains );

		} ;

		// Add twice with different size in order to avoid some artifacts on the reflection
		addMountain( 120000 );
		addMountain( 150000 );

		// Add a black cylinder to hide the skybox under the water
		var cylinder = new THREE.Mesh(
			new THREE.CylinderGeometry( 150000, 150000, 150000, 32, 1, true ),
			new THREE.MeshBasicMaterial( { color: new THREE.Color( 1, 1, 1 ), side: THREE.BackSide } )
		);
		cylinder.position.y = -80000;
		demo.ms_Scene.add( cylinder );

	},

	LoadSkyBox : function LoadSkyBox() {

		var cubeShader = THREE.ShaderLib['cube'];

		var skyBoxMaterial = new THREE.ShaderMaterial( {
			fragmentShader: cubeShader.fragmentShader,
			vertexShader: cubeShader.vertexShader,
			uniforms: cubeShader.uniforms,
			side: THREE.BackSide
		} );

		this.ms_SkyBox = new THREE.Mesh(
			new THREE.BoxGeometry( 450000, 450000, 450000 ),
			skyBoxMaterial
		);

		this.ms_Scene.add( this.ms_SkyBox );

		// https://stackoverflow.com/questions/3552944/how-to-get-the-anchor-from-the-url-using-jquery
		var url = window.location.href, idx = url.indexOf("#");
		var anchor = idx != -1 ? url.substring(idx+1) : null;
		var environmentParameter = anchor;

		if( environmentParameter !== null ) {
			this.ms_Environment = environmentParameter;
		}

		this.UpdateEnvironment( this.ms_Environment );

	},

	UpdateEnvironment : function UpdateEnvironment( key ) {

		var textureName = '';
		var textureExt = ".jpg";
		var directionalLightPosition = null;
		var directionalLightColor = null;
		var raining = false;

		switch( key ) {
			case 'night':
				textureName = 'grimmnight';
				directionalLightPosition = new THREE.Vector3( -0.3, 0.3, 1 );
				directionalLightColor = new THREE.Color( 1, 1, 1 );
				raining = true;
				break;
			case 'morning':
				textureName = 'clouds';
				directionalLightPosition = new THREE.Vector3( -1, 0.5, 0.8 );
				directionalLightColor = new THREE.Color( 1, 0.95, 0.8 );
				break;
			case 'day':
				textureName = 'sky';
				directionalLightPosition = new THREE.Vector3( -0.5, 0.5, -0.6 );
				directionalLightColor = new THREE.Color( 1, 0.95, 0.9 );
				break;
			case 'cloudy':
				textureName = 'miramar';
				directionalLightPosition = new THREE.Vector3( 0.3, 1.0, 0.5 );
				directionalLightColor = new THREE.Color( 0.9, 0.95, 1 );
				raining = true;
				break;
			case 'sunset':
				textureName = 'sunset';
				directionalLightPosition = new THREE.Vector3( -0.7, 0.2, -1 );
				directionalLightColor = new THREE.Color( 1, 0.8, 0.5 );
				break;
			case 'interstellar':
				textureName = 'interstellar';
				directionalLightPosition = new THREE.Vector3( -0.7, 1.0, -0.4 );
				directionalLightColor = new THREE.Color( 0.8, 1.0, 0.95 );
				break;
			case 'apocalypse':
				textureName = 'violent_days';
				directionalLightPosition = new THREE.Vector3( 1, 0.3, 1 );
				directionalLightColor = new THREE.Color( 1, 0.85, 0.3 );
				break;
			default:
				return;
		};

		this.ms_Environment = key;
		this.ms_Raining = raining;
		this.ms_MainDirectionalLight.position.copy( directionalLightPosition );
		this.ms_MainDirectionalLight.color.copy( directionalLightColor );
		this.ms_Ocean.materialOcean.uniforms.u_sunDirection.value.copy( this.ms_MainDirectionalLight.position );
		if ( raining ) {
			if(!typeof this.ms_soundRain === 'undefined') this.ms_soundRain.play();
		else console.log('Sound disabled due to licensing');
		}
		else {
			if(!typeof this.ms_soundRain === 'undefined') this.ms_soundRain.pause();
		else console.log('Sound disabled due to licensing');
		}
		
		var sources = [
			'img/' + textureName + '_west' + textureExt,
			'img/' + textureName + '_east' + textureExt,
			'img/' + textureName + '_up' + textureExt,
			'img/' + textureName + '_down' + textureExt,
			'img/' + textureName + '_south' + textureExt,
			'img/' + textureName + '_north' + textureExt
		];
		var images = [];

		var cubeMap = new THREE.CubeTexture( images );
		cubeMap.flipY = false;

		var imageLoader = this.ms_ImageLoader;
		var loaded = 0;
		var loadTexture = function ( i ) {
			imageLoader.load( sources[ i ], function ( image ) {
				cubeMap.images[ i ] = image;
				loaded ++;
				if ( loaded === 6 ) {
					cubeMap.needsUpdate = true;
				}
			} );

		}

		for ( var i = 0, il = sources.length; i < il; ++ i ) {
			loadTexture( i );
		}
		
		cubeMap.format = THREE.RGBFormat;
		cubeMap.generateMipmaps = false;
		cubeMap.magFilter = THREE.LinearFilter;
		cubeMap.minFilter = THREE.LinearFilter;

		this.ms_SkyBox.material.uniforms['tCube'].value = cubeMap;
	},

	Display : function () {

		this.ms_Renderer.render( this.ms_Scene, this.ms_Camera );

	},

	Update : function () {

		// Update camera position
		if( this.ms_Camera.position.y < 0.0 ) {
			this.ms_Camera.position.y = 2.0;
		}

		// Update black ship displacements
		this.UpdateCommands();
		this.ms_GroupShip.rotation.y += this.ms_Commands.movements.angle;
		this.ms_BlackPearlShip.rotation.z = -this.ms_Commands.movements.angle * 10.0;
		this.ms_BlackPearlShip.rotation.x = this.ms_Commands.movements.speed * 0.1;
		var shipDisplacement = (new THREE.Vector3(0, 0, -1)).applyEuler(this.ms_GroupShip.rotation).multiplyScalar( 10.0 * this.ms_Commands.movements.speed );
		this.ms_GroupShip.position.add( shipDisplacement );

		var currentTime = new Date().getTime();
		this.ms_Ocean.deltaTime = ( currentTime - lastTime ) / 1000 || 0.0;
		lastTime = currentTime;

		// Update black ship movements
		if( this.ms_BlackPearl !== null )
		{
			var animationRatio = 1.0 + this.ms_Commands.movements.speed * 1.0;
			this.ms_BlackPearl.rotation.y = Math.cos( currentTime * 0.0008 ) * 0.05 - 0.025;
			this.ms_BlackPearl.rotation.x = Math.sin( currentTime * 0.001154 + 0.78 ) * 0.1 + 0.05;
		}

		// Update rain
		if( this.ms_Raining ) {
			var seed = 1;
			var fastRandom = function fastRandom() {
				// https://stackoverflow.com/questions/521295/javascript-random-seeds
				var x = Math.sin( seed++ ) * 10000;
				return x - Math.floor( x );
			}
			for( i in this.ms_RainGeometry.vertices )
			{
				var speed = 4.0;
				this.ms_RainGeometry.vertices[i].y -= fastRandom() * speed + speed;
				if( this.ms_RainGeometry.vertices[i].y < -50 )
					this.ms_RainGeometry.vertices[i].y = 50;
			}
			this.ms_Rain.rotation.set( -this.ms_Camera.rotation.x, -this.ms_Camera.rotation.y, -this.ms_Camera.rotation.z, "ZYX" );
			this.ms_RainGeometry.verticesNeedUpdate = true;
		}

		// Render ocean reflection
		this.ms_Camera.remove( this.ms_Rain );
		this.ms_Ocean.render();
		if( this.ms_Raining )
			this.ms_Camera.add( this.ms_Rain );

		// Updade clouds
		this.ms_CloudShader.update();

		// Update ocean data
		this.ms_Ocean.update();
		
		this.ms_Controls.update();
		this.Display();

	},

	UpdateCommands : function UpdateCommands() {

		var states = this.ms_Commands.states;

		// Update speed
		var targetSpeed = 0.0;
		if( states.up ) {
			targetSpeed = 1.0;
		}
		else if( states.down ) {
			targetSpeed = -0.5;
		}
		var curSpeed = this.ms_Commands.movements.speed ;
		this.ms_Commands.movements.speed = curSpeed + ( targetSpeed - curSpeed ) * 0.02;

		// Update angle
		var targetAngle = 0.0;
		if( states.left ) {
			targetAngle = Math.PI * 0.005;
		}
		else if( states.right ) {
			targetAngle = -Math.PI * 0.005;
		}
		if( states.down ) {
			targetAngle *= -1.0;
		}
		
		var curAngle = this.ms_Commands.movements.angle ;
		this.ms_Commands.movements.angle = curAngle + ( targetAngle - curAngle ) * 0.02;

	},

	Resize : function ( inWidth, inHeight ) {

		this.ms_Camera.aspect = inWidth / inHeight;
		this.ms_Camera.updateProjectionMatrix();
		this.ms_Renderer.setSize( inWidth, inHeight );
		this.Display();

	}
};
