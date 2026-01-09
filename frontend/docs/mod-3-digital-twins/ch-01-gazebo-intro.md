---
sidebar_position: 2
title: Introduction to Gazebo
description: Open-source robotics simulation for physics-accurate testing
hardware_requirements: "Dedicated GPU recommended (integrated graphics possible for simple scenes)"
resource_type: on-prem
---

# Introduction to Gazebo

Gazebo is the most widely used open-source robotics simulator, providing physics-accurate environments for testing robot behavior before deploying to real hardware.

## Why Simulate?

Simulation offers critical advantages for robotics development:

| Benefit | Description |
|---------|-------------|
| **Safety** | Test dangerous scenarios without physical risk |
| **Speed** | Run faster than real-time for training |
| **Cost** | No hardware wear during development |
| **Reproducibility** | Repeat exact scenarios for debugging |
| **Scale** | Test fleet behavior, rare edge cases |

## Gazebo Architecture

Gazebo consists of several key components:

```
┌──────────────────────────────────────────────────┐
│                    Gazebo                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │  Physics   │  │  Rendering │  │  Sensors   │ │
│  │   Engine   │  │   Engine   │  │ Simulation │ │
│  │   (ODE,    │  │   (OGRE)   │  │  (Lidar,   │ │
│  │   Bullet)  │  │            │  │   Camera)  │ │
│  └────────────┘  └────────────┘  └────────────┘ │
│         │               │               │        │
│         └───────────────┼───────────────┘        │
│                         ▼                        │
│              ┌────────────────┐                  │
│              │  ROS 2 Bridge  │                  │
│              └────────────────┘                  │
└──────────────────────────────────────────────────┘
                         │
                         ▼
               ┌─────────────────┐
               │  ROS 2 Nodes    │
               │  (Your Code)    │
               └─────────────────┘
```

## Creating a World

Gazebo worlds are defined in SDF (Simulation Description Format):

```xml
<?xml version="1.0" ?>
<sdf version="1.8">
  <world name="simple_world">

    <!-- Lighting -->
    <light type="directional" name="sun">
      <cast_shadows>true</cast_shadows>
      <pose>0 0 10 0 0 0</pose>
      <diffuse>0.8 0.8 0.8 1</diffuse>
    </light>

    <!-- Ground plane -->
    <model name="ground_plane">
      <static>true</static>
      <link name="link">
        <collision name="collision">
          <geometry>
            <plane>
              <normal>0 0 1</normal>
              <size>100 100</size>
            </plane>
          </geometry>
        </collision>
        <visual name="visual">
          <geometry>
            <plane>
              <normal>0 0 1</normal>
              <size>100 100</size>
            </plane>
          </geometry>
          <material>
            <ambient>0.8 0.8 0.8 1</ambient>
          </material>
        </visual>
      </link>
    </model>

  </world>
</sdf>
```

## Robot Description (URDF)

Robots are typically described in URDF (Unified Robot Description Format):

```xml
<?xml version="1.0"?>
<robot name="simple_robot">

  <!-- Base link -->
  <link name="base_link">
    <visual>
      <geometry>
        <box size="0.5 0.3 0.1"/>
      </geometry>
      <material name="blue">
        <color rgba="0 0 0.8 1"/>
      </material>
    </visual>
    <collision>
      <geometry>
        <box size="0.5 0.3 0.1"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="5.0"/>
      <inertia ixx="0.1" ixy="0" ixz="0"
               iyy="0.1" iyz="0" izz="0.1"/>
    </inertial>
  </link>

  <!-- Wheel -->
  <link name="wheel_left">
    <visual>
      <geometry>
        <cylinder radius="0.1" length="0.05"/>
      </geometry>
    </visual>
    <collision>
      <geometry>
        <cylinder radius="0.1" length="0.05"/>
      </geometry>
    </collision>
  </link>

  <!-- Joint connecting wheel to base -->
  <joint name="wheel_left_joint" type="continuous">
    <parent link="base_link"/>
    <child link="wheel_left"/>
    <origin xyz="0.2 0.175 0" rpy="-1.5708 0 0"/>
    <axis xyz="0 0 1"/>
  </joint>

</robot>
```

## Sensor Simulation

Gazebo simulates various sensors:

### Lidar

```xml
<sensor name="lidar" type="ray">
  <ray>
    <scan>
      <horizontal>
        <samples>360</samples>
        <resolution>1</resolution>
        <min_angle>-3.14159</min_angle>
        <max_angle>3.14159</max_angle>
      </horizontal>
    </scan>
    <range>
      <min>0.1</min>
      <max>10.0</max>
    </range>
  </ray>
  <update_rate>10</update_rate>
</sensor>
```

### Camera

```xml
<sensor name="camera" type="camera">
  <camera>
    <horizontal_fov>1.047</horizontal_fov>
    <image>
      <width>640</width>
      <height>480</height>
      <format>R8G8B8</format>
    </image>
    <clip>
      <near>0.1</near>
      <far>100</far>
    </clip>
  </camera>
  <update_rate>30</update_rate>
</sensor>
```

## ROS 2 Integration

Connect Gazebo to ROS 2 using `ros_gz_bridge`:

```python
from launch import LaunchDescription
from launch.actions import ExecuteProcess
from launch_ros.actions import Node

def generate_launch_description():
    return LaunchDescription([
        # Start Gazebo
        ExecuteProcess(
            cmd=['gz', 'sim', 'my_world.sdf'],
            output='screen'
        ),

        # Bridge for cmd_vel
        Node(
            package='ros_gz_bridge',
            executable='parameter_bridge',
            arguments=[
                '/cmd_vel@geometry_msgs/msg/Twist@gz.msgs.Twist'
            ],
        ),

        # Bridge for lidar
        Node(
            package='ros_gz_bridge',
            executable='parameter_bridge',
            arguments=[
                '/lidar@sensor_msgs/msg/LaserScan@gz.msgs.LaserScan'
            ],
        ),
    ])
```

## Physics Engines

Gazebo supports multiple physics backends:

| Engine | Strengths | Use Case |
|--------|-----------|----------|
| ODE | Fast, stable | Default choice |
| Bullet | Soft bodies | Deformable objects |
| DART | Accurate joints | Manipulation |
| Simbody | Biomechanics | Humanoids |

## Best Practices

### 1. Start Simple

Begin with basic shapes before adding complexity:

```xml
<!-- Start with boxes -->
<geometry><box size="1 1 1"/></geometry>

<!-- Add meshes later for visuals only -->
<visual>
  <geometry><mesh filename="model://robot/mesh.dae"/></geometry>
</visual>
<collision>
  <geometry><box size="0.5 0.5 0.5"/></geometry>
</collision>
```

### 2. Tune Physics Parameters

Default physics may not match your hardware:

```xml
<physics type="ode">
  <max_step_size>0.001</max_step_size>
  <real_time_factor>1.0</real_time_factor>
  <real_time_update_rate>1000</real_time_update_rate>
</physics>
```

### 3. Use Collision Filtering

Prevent unnecessary collision checks:

```xml
<collision name="collision">
  <surface>
    <contact>
      <collide_bitmask>0x01</collide_bitmask>
    </contact>
  </surface>
</collision>
```

## Summary

Gazebo provides:
- Physics-accurate simulation
- Sensor modeling (lidar, camera, IMU)
- ROS 2 integration via bridges
- Multiple physics engine options

This foundation enables safe, rapid development before hardware deployment.

## Next Steps

- Creating custom robot models
- Advanced sensor simulation
- Programmatic world generation
- Integration with Isaac Sim for GPU acceleration
