A trip under the moonlight
=========

Fast Fourier Transform ocean rendering for Three.js

This demo shows a way to render realistic scenes in WebGL.

You can travel by using the keyboard and the environment can be selected. You can also explore the working of the scene by typing 'h'.

Live demo: https://jbouny.github.io/fft-ocean/

### Screenshots

![Alt text](/visual/night_ocean_fft.jpg "Ocean rendering in a night environment")

![Alt text](/visual/sunset_ocean_fft.jpg "Ocean rendering in a sunset environment")

![Alt text](/visual/day_ocean_fft.jpg "Ocean rendering in a day environment")

### Features

- Ocean rendering is based on the generation of a displacement map and a normal map applied with vertex and fragment shader
- Ocean mesh is computed in screen space
- Clouds and rain come from Three.js community

### Screen space grid

The screen space working is in fact simple:

- Add a grid in the scene, anywhere
- The grid must always be seen by the camera, or the vertex shader will not be applied
- In the vertex shader, the grid is then put in front of the camera in order to fill the entire screen
- In the vertex shader, the grid is projected on a 3d plane (just change the depth)

A complete explanation can be find here: http://habib.wikidot.com/projected-grid-ocean-shader-full-html-version

So, results are here.

With a 64*64 grid:

![Alt text](/visual/screen_space_64.jpg "Screen space 64*64 grid")

With a 256*256 grid:

![Alt text](/visual/screen_space_256.jpg "Screen space 256*256 grid")




### Acknowledgments

- @mrdoob and the three.js community for the library
- @zz85 for the cloud shader
- @dli for the original WebGL version of the fft rendering http://david.li/waves/
- Aleksandr Albert for the three.js version and improvements www.routter.co.tt
- Hipshot for the skyboxes http://www.quake3world.com/forum/viewtopic.php?t=9242
- Kevin Boone for the 3d Black Pearl model
