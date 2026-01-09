---
sidebar_position: 2
title: ROS 2 Fundamentals
description: Core concepts and architecture of the Robot Operating System 2
hardware_requirements: "Ubuntu 22.04 recommended, Windows/macOS possible"
resource_type: on-prem
---

# ROS 2 Fundamentals

This chapter introduces the core concepts of ROS 2 (Robot Operating System 2), the middleware that connects sensors, processors, and actuators in modern robotic systems.

## What is ROS 2?

ROS 2 is not actually an operating system—it's a **robotics middleware** that provides:

- Inter-process communication
- Hardware abstraction
- Package management
- Standard tools and libraries

Think of ROS 2 as the "nervous system" that lets different parts of a robot communicate.

## Core Concepts

### Nodes

A **node** is the basic unit of computation in ROS 2. Each node is a process that performs a specific task.

```python
import rclpy
from rclpy.node import Node

class MinimalNode(Node):
    """A minimal ROS 2 node example."""

    def __init__(self):
        super().__init__('minimal_node')
        self.get_logger().info('Hello from ROS 2!')

def main():
    rclpy.init()
    node = MinimalNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

### Topics

**Topics** are named channels for publish-subscribe communication.

```python
from std_msgs.msg import String

class PublisherNode(Node):
    def __init__(self):
        super().__init__('publisher_node')
        self.publisher = self.create_publisher(String, 'chatter', 10)
        self.timer = self.create_timer(1.0, self.timer_callback)

    def timer_callback(self):
        msg = String()
        msg.data = 'Hello, ROS 2!'
        self.publisher.publish(msg)
```

```python
class SubscriberNode(Node):
    def __init__(self):
        super().__init__('subscriber_node')
        self.subscription = self.create_subscription(
            String,
            'chatter',
            self.listener_callback,
            10
        )

    def listener_callback(self, msg):
        self.get_logger().info(f'Received: {msg.data}')
```

### Services

**Services** provide request-response communication for synchronous operations.

```python
from example_interfaces.srv import AddTwoInts

class AddService(Node):
    def __init__(self):
        super().__init__('add_service')
        self.srv = self.create_service(
            AddTwoInts,
            'add_two_ints',
            self.add_callback
        )

    def add_callback(self, request, response):
        response.sum = request.a + request.b
        return response
```

### Actions

**Actions** handle long-running tasks with feedback and cancellation.

```
┌────────────┐         Goal          ┌────────────┐
│   Client   │ ───────────────────► │   Server   │
│            │ ◄─────────────────── │            │
│            │       Result         │            │
│            │ ◄─────────────────── │            │
│            │       Feedback       │            │
└────────────┘                       └────────────┘
```

## ROS 2 Architecture

### DDS (Data Distribution Service)

ROS 2 uses DDS as its communication layer, providing:

- **Discovery**: Nodes find each other automatically
- **QoS**: Quality of Service policies for reliability
- **Security**: Encrypted, authenticated communication

### Quality of Service (QoS)

QoS profiles control message delivery guarantees:

| Profile | Reliability | Durability | Use Case |
|---------|-------------|------------|----------|
| Sensor | Best effort | Volatile | Camera, lidar |
| Services | Reliable | Volatile | RPCs |
| Parameters | Reliable | Transient local | Configuration |

```python
from rclpy.qos import QoSProfile, ReliabilityPolicy

sensor_qos = QoSProfile(
    depth=10,
    reliability=ReliabilityPolicy.BEST_EFFORT
)

self.subscription = self.create_subscription(
    Image,
    'camera/image_raw',
    self.image_callback,
    sensor_qos
)
```

## Package Structure

A typical ROS 2 package:

```
my_robot_pkg/
├── package.xml          # Package metadata
├── setup.py             # Python build configuration
├── setup.cfg            # Entry points
├── resource/
│   └── my_robot_pkg     # Marker file
├── my_robot_pkg/
│   ├── __init__.py
│   └── my_node.py       # Node implementation
├── launch/
│   └── robot.launch.py  # Launch configuration
├── config/
│   └── params.yaml      # Parameters
└── test/
    └── test_node.py     # Unit tests
```

## Launch System

Launch files orchestrate multiple nodes:

```python
from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    return LaunchDescription([
        Node(
            package='my_robot_pkg',
            executable='sensor_node',
            name='lidar',
            parameters=[{'frame_id': 'lidar_link'}]
        ),
        Node(
            package='my_robot_pkg',
            executable='controller_node',
            name='controller',
            remappings=[('/cmd_vel', '/robot/cmd_vel')]
        ),
    ])
```

## Command Line Tools

Essential ROS 2 CLI commands:

```bash
# List all nodes
ros2 node list

# Show node info
ros2 node info /my_node

# List topics
ros2 topic list

# Echo topic messages
ros2 topic echo /chatter

# Call a service
ros2 service call /add_two_ints example_interfaces/srv/AddTwoInts "{a: 2, b: 3}"

# Launch a system
ros2 launch my_robot_pkg robot.launch.py
```

## Summary

ROS 2 provides the infrastructure for building modular, distributed robot systems:

- **Nodes** encapsulate functionality
- **Topics** enable pub-sub communication
- **Services** provide request-response patterns
- **Actions** handle long-running tasks
- **DDS** ensures reliable, secure communication

## Next Steps

In upcoming chapters:
- Building custom message types
- TF2 coordinate transformations
- Navigation and SLAM integration
- Real-time considerations

## References

1. ROS 2 Documentation: https://docs.ros.org/
2. Open Robotics: https://www.openrobotics.org/
