var DEMO =
{
	ms_Renderer : null,
	ms_Camera : null,
	ms_Scene : null,
	ms_Controls : null,
	ms_Ocean : null,
	
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

		document.body.appendChild( this.ms_Renderer.domElement );

		this.ms_Scene = new THREE.Scene();

		this.ms_GroupShip = new THREE.Object3D();
		this.ms_BlackPearlShip = new THREE.Object3D();
		this.ms_Scene.add( this.ms_GroupShip );
		this.ms_GroupShip.add( this.ms_BlackPearlShip );
		
		this.ms_Camera = new THREE.PerspectiveCamera( 55.0, WINDOW.ms_Width / WINDOW.ms_Height, 0.5, 300000 );
		this.ms_Camera.position.set( 0, 350, 800 );
		this.ms_Camera.lookAt( new THREE.Vector3() );
		this.ms_BlackPearlShip.add( this.ms_Camera );
		
		// Initialize Orbit control		
		this.ms_Controls = new THREE.OrbitControls( this.ms_Camera, this.ms_Renderer.domElement );
		this.ms_Controls.userPan = false;
		this.ms_Controls.noKeys = true;
		this.ms_Controls.userPanSpeed = 0;
		this.ms_Controls.minDistance = 0;
		this.ms_Controls.maxDistance = 20000.0;
		this.ms_Controls.minPolarAngle = 0;
		this.ms_Controls.maxPolarAngle = Math.PI * 0.495;
		
		this.InitializeScene();
		
		this.InitGui();
		this.InitCommands();
		
	},
	
	InitializeScene : function InitializeScene() {
		
		// Add light
		var mainDirectionalLight = new THREE.DirectionalLight( 0xffffff, 1.5 );
		mainDirectionalLight.position.set( -0.2, 1, 1 );
		this.ms_Scene.add( mainDirectionalLight );
		
		// Add Black Pearl
		var loader = new THREE.OBJMTLLoader();
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
			var rainTexture = THREE.ImageUtils.loadTexture( "img/water-drop.png" );

			var rainMaterial = new THREE.ShaderMaterial({
				uniforms: { texture: { type: 't', value: rainTexture } }, 
				vertexShader: document.getElementById('vertexShader').textContent,
				fragmentShader: document.getElementById('fragmentShader').textContent,
				transparent: true
			});
			
			this.ms_RainGeometry = new THREE.Geometry();
			for ( i = 0; i < 100; i++ )
			{
				var vertex = new THREE.Vector3();
				vertex.x = Math.random() * 2.0 * size - size;
				vertex.y = Math.random() * 2.0 * size - size;
				vertex.z = Math.random() * size - size * 0.5;
				this.ms_RainGeometry.vertices.push( vertex );
			}
			this.ms_Rain = new THREE.PointCloud( this.ms_RainGeometry, rainMaterial );
			this.ms_Camera.add( this.ms_Rain );
			this.ms_Rain.position.setZ( - size * 0.75 ) ;
		}
		
		this.LoadSkyBox();
		
		// Initialize Clouds
		this.ms_CloudShader = new CloudShader( this.ms_Renderer );
		this.ms_CloudShader.cloudMesh.scale.multiplyScalar( 3 );
		this.ms_Scene.add( this.ms_CloudShader.cloudMesh );
		
		// Initialize Ocean
		var gsize = 512; 
		var res = 512; 
		var gres = 128;
		var origx = -gsize / 2;
		var origz = -gsize / 2;
		this.ms_Ocean = new THREE.Ocean( this.ms_Renderer, this.ms_Camera, this.ms_Scene,
		{
			INITIAL_SIZE : 200.0,
			INITIAL_WIND : [ 10.0, 10.0 ],
			INITIAL_CHOPPINESS : 1.8,
			CLEAR_COLOR : [ 1.0, 1.0, 1.0, 0.0 ],
			SUN_DIRECTION : mainDirectionalLight.position.clone(),
			OCEAN_COLOR: new THREE.Vector3( 0.35, 0.4, 0.45 ),
			SKY_COLOR: new THREE.Vector3( 10.0, 13.0, 15.0 ),
			EXPOSURE : 0.15,
			GEOMETRY_RESOLUTION: gres,
			GEOMETRY_SIZE : gsize,
			RESOLUTION : res
		} );		
	},
	
	InitGui : function InitGui() {
	
		// Initialize UI
		var gui = new dat.GUI();
		dat.GUI.toggleHide();
		gui.add( this.ms_Ocean, "size", 10, 2000 ).onChange( function( v ) {
			this.object.size = v;
			this.object.changed = true;
		} );
		gui.add( this.ms_Ocean, "choppiness", 0.1, 4 ).onChange( function ( v ) {
			this.object.choppiness = v;
			this.object.changed = true;
		} );
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

	LoadSkyBox : function LoadSkyBox() {
	
		var aCubeMap = THREE.ImageUtils.loadTextureCube( [
			//*
			'img/grimmnight_west.jpg',
			'img/grimmnight_east.jpg',
			'img/grimmnight_up.jpg',
			'img/grimmnight_down.jpg',
			'img/grimmnight_south.jpg',
			'img/grimmnight_north.jpg',
			/*/
			'img/px.jpg',
			'img/nx.jpg',
			'img/py.jpg',
			'img/ny.jpg',
			'img/pz.jpg',
			'img/nz.jpg',
			//*/
			/*
			'img/skybox_0.jpg',
			'img/skybox_1.jpg',
			'img/skybox_2.jpg',
			'img/skybox_3.jpg',
			'img/skybox_4.jpg',
			'img/skybox_5.jpg',
			//*/

		] );
		aCubeMap.format = THREE.RGBFormat;

		var aShader = THREE.ShaderLib['cube'];
		aShader.uniforms['tCube'].value = aCubeMap;

		var aSkyBoxMaterial = new THREE.ShaderMaterial( {
		  fragmentShader: aShader.fragmentShader,
		  vertexShader: aShader.vertexShader,
		  uniforms: aShader.uniforms,
		  depthWrite: false,
		  side: THREE.BackSide
		} );

		var aSkybox = new THREE.Mesh(
		  new THREE.BoxGeometry( 200000, 200000, 200000 ),
		  aSkyBoxMaterial
		);
		
		this.ms_Scene.add( aSkybox );
		
	},
	
	Display : function () {
	
		this.ms_Renderer.render( this.ms_Scene, this.ms_Camera );
		
	},

	Update : function () {
	
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
		
		// Render ocean reflection
		this.ms_Camera.remove( this.ms_Rain );
		this.ms_Ocean.render( this.ms_Ocean.deltaTime );
		this.ms_Camera.add( this.ms_Rain );
		
		// Updade clouds
		this.ms_CloudShader.update();
		
		// Update ocean data
		this.ms_Ocean.overrideMaterial = this.ms_Ocean.materialOcean;
		if ( this.ms_Ocean.changed ) {
			this.ms_Ocean.materialOcean.uniforms.u_size.value = this.ms_Ocean.size;
			this.ms_Ocean.materialOcean.uniforms.u_exposure.value = this.ms_Ocean.exposure;
			this.ms_Ocean.changed = false;
		}
		this.ms_Ocean.materialOcean.uniforms.u_normalMap.value = this.ms_Ocean.normalMapFramebuffer ;
		this.ms_Ocean.materialOcean.uniforms.u_displacementMap.value = this.ms_Ocean.displacementMapFramebuffer ;
		this.ms_Ocean.materialOcean.depthTest = true;
		this.ms_Controls.update();
		this.Display();
		
	},
	
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