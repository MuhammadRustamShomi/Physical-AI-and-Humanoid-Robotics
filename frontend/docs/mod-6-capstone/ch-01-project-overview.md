---
sidebar_position: 2
title: Project Overview
description: Capstone project requirements, timeline, and deliverables
hardware_requirements: "Full robotics workstation or cloud GPU access"
resource_type: both
---

# Capstone Project Overview

The capstone project integrates all concepts from the curriculum into a functional conversational humanoid robot system.

## Project Vision

Build a robot that can:

1. **Understand** natural language instructions
2. **Perceive** its environment through vision
3. **Plan** manipulation sequences
4. **Execute** physical tasks
5. **Communicate** progress and ask clarifying questions

```
┌─────────────────────────────────────────────────────────────┐
│                  Conversational Humanoid                     │
│                                                              │
│   "Pick up the blue cup"                                     │
│          │                                                   │
│          ▼                                                   │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│   │   Speech    │───►│    VLA      │───►│   Motion    │    │
│   │ Recognition │    │   Model     │    │  Planning   │    │
│   └─────────────┘    └─────────────┘    └─────────────┘    │
│                             │                   │           │
│                             ▼                   ▼           │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│   │   Speech    │◄───│   State     │◄───│   Robot     │    │
│   │  Synthesis  │    │  Tracking   │    │  Execution  │    │
│   └─────────────┘    └─────────────┘    └─────────────┘    │
│          │                                                   │
│          ▼                                                   │
│   "I've picked up the blue cup"                              │
└─────────────────────────────────────────────────────────────┘
```

## Project Tracks

Choose based on hardware access:

### Track A: Simulation-Only

**For those without physical robot access**

- Full system in Isaac Sim
- Virtual humanoid or mobile manipulator
- Speech via simulated audio

Deliverables:
- [ ] Working Isaac Sim environment
- [ ] VLA model integration
- [ ] Video demonstration

### Track B: Physical Robot

**For those with hardware access**

- Real robot deployment
- Sim-to-real transfer demonstrated
- Live speech interaction

Deliverables:
- [ ] Safety documentation
- [ ] Working physical demo
- [ ] Sim-to-real comparison

### Track C: Hybrid

**Combination approach**

- Simulation for training/testing
- Physical deployment for select tasks
- Documented transfer process

## System Architecture

### Required Components

| Component | Technology | Module Reference |
|-----------|------------|------------------|
| Middleware | ROS 2 Humble | Module 2 |
| Simulation | Isaac Sim | Module 4 |
| Perception | VLA Model | Module 5 |
| Speech | Whisper + TTS | New |
| Control | MoveIt 2 | Module 2 |

### ROS 2 Node Graph

```python
# Recommended node structure
nodes = {
    "speech_recognition": {
        "subscribes": ["/audio/raw"],
        "publishes": ["/commands/text"]
    },
    "vla_inference": {
        "subscribes": ["/camera/image", "/commands/text"],
        "publishes": ["/actions/trajectory"]
    },
    "motion_planner": {
        "subscribes": ["/actions/trajectory"],
        "publishes": ["/joint_commands"]
    },
    "robot_controller": {
        "subscribes": ["/joint_commands"],
        "publishes": ["/joint_states"]
    },
    "speech_synthesis": {
        "subscribes": ["/status/text"],
        "publishes": ["/audio/output"]
    }
}
```

## Timeline

| Week | Phase | Deliverable |
|------|-------|-------------|
| 1 | Design | Architecture document, component selection |
| 2 | Setup | Development environment, simulation world |
| 3 | Perception | VLA model integration, camera pipeline |
| 4 | Planning | Motion planning, trajectory execution |
| 5 | Speech | Voice interaction, dialogue system |
| 6 | Integration | End-to-end testing, debugging |
| 7 | Polish | Error handling, edge cases |
| 8 | Presentation | Demo video, documentation |

## Evaluation Criteria

### Technical (70%)

| Criterion | Points | Description |
|-----------|--------|-------------|
| System Integration | 20 | ROS 2 nodes communicate correctly |
| VLA Performance | 20 | Model follows diverse instructions |
| Motion Execution | 15 | Smooth, collision-free trajectories |
| Speech Interface | 10 | Accurate recognition and synthesis |
| Error Handling | 5 | Graceful failure recovery |

### Documentation (20%)

| Criterion | Points | Description |
|-----------|--------|-------------|
| Architecture | 8 | Clear system design document |
| Setup Guide | 7 | Reproducible installation |
| Demo Video | 5 | Professional presentation |

### Innovation (10%)

| Criterion | Points | Description |
|-----------|--------|-------------|
| Novel Features | 5 | Beyond baseline requirements |
| Generalization | 5 | Handles unseen scenarios |

## Safety Requirements

:::danger Mandatory Safety
All physical deployments MUST include these safety measures. Non-compliance results in project failure.
:::

### Required Safety Features

```python
class SafetyController:
    """Mandatory safety wrapper for all robot control."""

    def __init__(self):
        self.e_stop_active = False
        self.workspace_bounds = np.array([
            [-0.5, 0.5],  # x
            [-0.5, 0.5],  # y
            [0.0, 1.0]    # z
        ])
        self.max_velocity = 0.5  # m/s
        self.max_force = 50  # N

    def check_command(self, command):
        """Validate command before execution."""
        if self.e_stop_active:
            raise SafetyException("E-stop active")

        if not self.in_workspace(command.position):
            raise SafetyException("Out of workspace bounds")

        if command.velocity > self.max_velocity:
            command.velocity = self.max_velocity

        return command
```

### Required Documentation

1. **Risk Assessment**: Identify all potential hazards
2. **Emergency Procedures**: Steps for each hazard
3. **Workspace Definition**: Physical boundaries
4. **Human Interaction Protocol**: Rules for nearby humans

## Getting Started

### Week 1 Checklist

- [ ] Choose project track (A, B, or C)
- [ ] Document available hardware
- [ ] Set up development environment
- [ ] Create ROS 2 workspace
- [ ] Load base robot model in simulation
- [ ] Draft system architecture

### Starter Code

```bash
# Create workspace
mkdir -p ~/capstone_ws/src
cd ~/capstone_ws/src

# Clone starter template
git clone https://github.com/physical-ai/capstone-template.git

# Build
cd ~/capstone_ws
colcon build

# Source
source install/setup.bash

# Launch simulation
ros2 launch capstone_robot simulation.launch.py
```

## Resources

### Robot Platforms

| Platform | Type | Simulation | Physical |
|----------|------|------------|----------|
| Franka Panda | Arm | Isaac Sim | Available |
| Fetch | Mobile Manipulator | Gazebo | Limited |
| Unitree H1 | Humanoid | Isaac Sim | Limited |
| Custom | Any | Build | N/A |

### Pretrained Models

- OpenVLA-7B: General manipulation
- RT-2-X: Multi-robot transfer
- Octo: Diffusion-based policy

## Summary

The capstone integrates:
- ROS 2 for system integration
- Isaac Sim for development
- VLA for language-guided action
- Speech for natural interaction

This is your opportunity to build a complete physical AI system.

## Next Steps

1. Complete Week 1 checklist
2. Schedule architecture review
3. Begin simulation environment setup
