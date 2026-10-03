# Optional production robot asset

Place your production model in this directory as:

robot.glb

Do not create an empty file named robot.glb. When the model is absent,
the website builds its procedural 3D robot automatically.

## Coordinate convention

- Model upright on +Y.
- Model facing +Z.
- Use meters.
- Recommended height: 1.82 meters.
- Apply object scales before export.
- Keep the model centered around X=0 and Z=0.
- The viewer normalizes height and places the feet on the floor.

## Component organization

Use a unique named group for each selectable component.
Place that component's geometry beneath the group.

Use neutral, unnamed-for-selection mesh names inside the group.
Do not give both a parent group and its child mesh the same component name.

Required major component names:

robot_head
robot_eye
robot_neck
chest_armor
torso_internal
shoulder_left
shoulder_right
upper_arm_left
upper_arm_right
forearm_left
forearm_right
hand_left
hand_right
waist
hip
hip_left
hip_right
thigh_left
thigh_right
knee_left
knee_right
lower_leg_left
lower_leg_right
ankle_left
ankle_right
foot_left
foot_right

Finger component names:

finger_left_thumb
finger_left_index
finger_left_middle
finger_left_ring
finger_left_little
finger_right_thumb
finger_right_index
finger_right_middle
finger_right_ring
finger_right_little

"Left" and "right" refer to the robot's own left and right.

## Animation hierarchy

Put animated joint pivots above selectable component groups.

Example:

joint_shoulder_left
├── shoulder_left
│   └── shoulder_geometry
├── upper_arm_left
│   └── upper_arm_geometry
└── joint_elbow_left
    ├── forearm_left
    │   └── forearm_geometry
    └── joint_wrist_left
        ├── hand_left
        │   └── hand_geometry
        └── joint_finger_left_index
            └── finger_left_index
                └── finger_geometry

Animate the joint nodes, not translations on named component groups.
The viewer owns component-group translations for inspection and explosion.

Supply looping animation clips named:

idle
walk
wave
inspect

Clip names are matched without case sensitivity.
Walk should be an in-place cycle without root translation.
Missing animation modes are disabled rather than simulated incorrectly.

Use rigid mesh pieces for removable mechanical components.
A single skinned mesh cannot be disassembled into independent parts by naming
bones alone. This viewer is designed for rigid mechanical assemblies.

## Materials and appearance

Use glTF metallic-roughness PBR materials.

Suggested art direction:
- Pearl-white clear-coated armor
- Graphite internal frames
- Brushed metal actuator housings
- Dark elastomer cables and joint seals
- Circular optical sensor with restrained pale-green emission
- Real geometric gaps and internal structures behind removable panels

Avoid baked logos, company names, or recognizable third-party product designs.

## Suggested production budgets

These are project targets, not guarantees of device performance:

- 60,000–150,000 triangles total
- Prefer fewer than 150 draw calls
- Reuse geometry and materials where practical
- Prefer shared 1K or 2K texture atlases
- Use KTX2/Basis textures when available
- Draco geometry compression is supported
- Meshopt compression is not configured in this implementation
- Aim for a GLB under 15 MB

Embed textures and buffers in the GLB.
The viewer's studio lighting and floor are supplied separately.
