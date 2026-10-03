# VESPER — Unit 01

An original interactive humanoid robotics concept built as a static website.

The application presents an articulated 3D robot in a dark studio with
pearl armor, metallic internals, a circular optical sensor, and component
inspection controls.

All product specifications and component descriptions are fictional.

## Included experience

- Real procedural 3D robot when no production GLB is present
- Automatic loading of `assets/models/robot.glb`
- Mouse and touch orbit controls
- Scroll and pinch zoom
- Camera damping
- Hover highlighting
- Individually selectable body components and fingers
- Camera transitions during inspection
- Selected-component separation
- Dimming of unselected geometry
- Component information panel
- Back button and Escape-key reassembly
- Exploded view and smooth reassembly
- Idle, walk, wave, and inspect modes
- Motion pause control
- Reduced-motion preference support
- Keyboard-accessible component selection
- Loading progress and model download progress
- Responsive canvas and mobile layout
- Studio environment reflections and directional shadows

The procedural fallback is a concept visualization, not a photorealistic
production model.

The floor uses PBR shading and receives shadows. It does not implement
mirror reflections or screen-space reflections.

The procedural walk is an in-place illustrative animation. It does not
include inverse kinematics, physical simulation, or guaranteed foot locking.

Finger components contain modeled segments. The procedural animation curls
each whole digit from its base; it does not independently animate every
phalange joint.

## Technologies

- HTML
- CSS
- JavaScript ES modules
- Three.js 0.180.0, pinned through an import map
- WebGL
- OrbitControls
- GLTFLoader
- DRACOLoader
- KTX2Loader

Camera, component, and UI-related state transitions use JavaScript
interpolation. GSAP is not required.

There is no backend, package installation, or build step.

The default project loads Three.js, optional model decoders, and fonts from
CDNs. Internet access is required unless those dependencies are vendored.

## Folder structure
