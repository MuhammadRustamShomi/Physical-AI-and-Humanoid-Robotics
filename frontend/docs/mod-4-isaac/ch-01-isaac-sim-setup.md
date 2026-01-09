---
sidebar_position: 2
title: Isaac Sim Setup
description: Installation and first simulation with NVIDIA Isaac Sim
hardware_requirements: "NVIDIA RTX GPU (RTX 3070 minimum), 32GB RAM, 100GB SSD, Ubuntu 22.04 or Windows 11"
resource_type: on-prem
---

# Isaac Sim Setup

This chapter guides you through installing NVIDIA Isaac Sim and running your first GPU-accelerated robotics simulation.

## Hardware Requirements

:::caution Hardware Requirements
Isaac Sim has significant hardware requirements. Verify your system meets these specifications before proceeding.
:::

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| GPU | RTX 3070 (8GB VRAM) | RTX 4090 (24GB VRAM) |
| CPU | Intel i7 / AMD Ryzen 7 | Intel i9 / AMD Ryzen 9 |
| RAM | 32 GB | 64 GB |
| Storage | 100 GB SSD | 500 GB NVMe |
| OS | Ubuntu 22.04 / Windows 11 | Ubuntu 22.04 |
| Driver | NVIDIA 525.60+ | Latest stable |

## Installation Methods

### Method 1: Omniverse Launcher (Recommended)

1. Download the NVIDIA Omniverse Launcher
2. Install the launcher
3. Navigate to Exchange → Isaac Sim
4. Click Install

```bash
# Verify GPU is detected
nvidia-smi

# Check driver version (should be 525.60+)
nvidia-smi --query-gpu=driver_version --format=csv
```

### Method 2: Docker Container

For reproducible environments:

```bash
# Pull the Isaac Sim container
docker pull nvcr.io/nvidia/isaac-sim:2023.1.1

# Run with GPU support
docker run --gpus all -it --rm \
  -e DISPLAY=$DISPLAY \
  -v /tmp/.X11-unix:/tmp/.X11-unix \
  nvcr.io/nvidia/isaac-sim:2023.1.1
```

### Method 3: pip Install (Headless)

For training without visualization:

```bash
pip install isaacsim-rl isaacsim-robot
```

## First Launch

After installation, launch Isaac Sim:

```bash
# From Omniverse installation
~/.local/share/ov/pkg/isaac_sim-2023.1.1/isaac-sim.sh

# Or via the Omniverse Launcher GUI
```

Initial launch downloads assets and may take 10-15 minutes.

## Understanding the Interface

Isaac Sim's interface consists of:

```
┌────────────────────────────────────────────────────────────┐
│  Menu Bar                                                   │
├────────────┬───────────────────────────────┬───────────────┤
│            │                               │               │
│  Stage     │      Viewport                 │  Properties   │
│  (Scene    │      (3D View)                │  (Inspector)  │
│   Tree)    │                               │               │
│            │                               │               │
├────────────┴───────────────────────────────┴───────────────┤
│  Content Browser / Console / Timeline                       │
└────────────────────────────────────────────────────────────┘
```

## Loading Your First Robot

Isaac Sim includes sample robots. Load the Franka Panda arm:

```python
# In Isaac Sim's Script Editor
from omni.isaac.core import World
from omni.isaac.franka import Franka

# Create world
world = World()
world.scene.add_default_ground_plane()

# Add robot
franka = world.scene.add(
    Franka(
        prim_path="/World/Franka",
        name="franka"
    )
)

# Initialize
world.reset()
```

## Running a Simulation

Basic simulation loop:

```python
from omni.isaac.core import World
from omni.isaac.core.utils.types import ArticulationAction
import numpy as np

world = World()
franka = world.scene.add(Franka(prim_path="/World/Franka", name="franka"))
world.reset()

# Simulation loop
for i in range(1000):
    # Apply joint positions
    joint_positions = np.sin(i * 0.01) * np.array([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.0])

    action = ArticulationAction(
        joint_positions=joint_positions
    )
    franka.apply_action(action)

    # Step simulation
    world.step(render=True)
```

## ROS 2 Integration

Isaac Sim provides native ROS 2 support:

```python
from omni.isaac.ros2_bridge import ROS2Bridge

# Enable ROS 2 bridge
ros2_bridge = ROS2Bridge()

# Publish joint states
ros2_bridge.create_joint_state_publisher(
    robot_prim_path="/World/Franka",
    topic_name="/joint_states"
)

# Subscribe to commands
ros2_bridge.create_joint_command_subscriber(
    robot_prim_path="/World/Franka",
    topic_name="/joint_commands"
)
```

## Performance Optimization

### GPU Memory Management

```python
# Reduce VRAM usage
import carb
carb.settings.get_settings().set(
    "/rtx/rendermode", "PathTracing"  # or "RayTracedLighting"
)
carb.settings.get_settings().set(
    "/rtx/pathtracing/spp", 1  # Samples per pixel
)
```

### Headless Mode

For training servers:

```bash
# Run without GUI
./isaac-sim.sh --headless

# Or in Python
from omni.isaac.kit import SimulationApp
simulation_app = SimulationApp({"headless": True})
```

## Common Issues

### Issue: Slow Performance

**Solution**: Reduce rendering quality

```python
# Use faster render mode
from omni.isaac.core import World
world = World(physics_dt=1/60, rendering_dt=1/30)  # Render less frequently
```

### Issue: Out of Memory

**Solution**: Use smaller assets and batch simulations

```python
# Clear unused assets
from pxr import Sdf
stage = omni.usd.get_context().get_stage()
stage.Reload()
```

### Issue: ROS 2 Not Connecting

**Solution**: Verify ROS 2 environment

```bash
# Source ROS 2 before launching Isaac Sim
source /opt/ros/humble/setup.bash
./isaac-sim.sh
```

## Verification Checklist

Before proceeding, verify:

- [ ] Isaac Sim launches without errors
- [ ] GPU is detected (`nvidia-smi` shows activity)
- [ ] Sample robot loads and moves
- [ ] Physics simulation runs at real-time or faster
- [ ] ROS 2 bridge publishes/subscribes correctly

## Summary

Isaac Sim provides:
- GPU-accelerated physics simulation
- Photorealistic rendering for perception
- Native ROS 2 integration
- Python scripting environment
- Support for reinforcement learning

## Next Steps

- Importing custom robots (URDF → USD)
- Setting up Isaac Gym for RL training
- Domain randomization for sim-to-real
- Multi-robot simulation

## References

1. NVIDIA Isaac Sim Documentation
2. Omniverse Developer Guide
3. Isaac ROS GitHub Repository
