---
sidebar_position: 1
title: NVIDIA Isaac Platform
description: Industrial-grade simulation and AI training
hardware_requirements: "NVIDIA RTX GPU (RTX 3070 minimum, RTX 4090 recommended), 32GB RAM, 100GB SSD"
resource_type: on-prem
---

# NVIDIA Isaac Platform

Module 4 explores NVIDIA's Isaac platform for industrial-grade robotics development. Isaac provides GPU-accelerated simulation, perception, and manipulation capabilities.

## Learning Objectives

By the end of this module, you will:

- Set up and navigate Isaac Sim
- Train reinforcement learning policies in simulation
- Deploy trained models to physical robots
- Use Isaac ROS for production perception

## Hardware Requirements

:::caution Hardware Required
This module requires significant GPU resources:
- **Minimum**: NVIDIA RTX 3070, 16GB RAM
- **Recommended**: NVIDIA RTX 4090, 32GB RAM
- **Storage**: 100GB SSD for simulation assets

Cloud alternatives are available but may have latency constraints.
:::

## The Isaac Ecosystem

| Component | Function |
|-----------|----------|
| Isaac Sim | GPU-accelerated physics simulation |
| Isaac ROS | Production perception packages |
| Isaac Gym | Massively parallel RL training |
| Isaac SDK | Edge deployment toolkit |

## Prerequisites

- Completion of Modules 1-3
- NVIDIA GPU with CUDA support
- Basic reinforcement learning concepts

## Chapters in This Module

1. [Isaac Sim Setup](./ch-01-isaac-sim-setup) - Installation and first simulation
