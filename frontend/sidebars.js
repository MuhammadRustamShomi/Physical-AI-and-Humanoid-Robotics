// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  curriculumSidebar: [
    {
      type: 'category',
      label: 'Module 1: Physical AI Foundations',
      link: {
        type: 'doc',
        id: 'mod-1-physical-ai/intro',
      },
      items: [
        'mod-1-physical-ai/ch-01-intro-embodied-ai',
      ],
    },
    {
      type: 'category',
      label: 'Module 2: ROS 2 Nervous System',
      link: {
        type: 'doc',
        id: 'mod-2-ros2/intro',
      },
      items: [
        'mod-2-ros2/ch-01-ros2-fundamentals',
      ],
    },
    {
      type: 'category',
      label: 'Module 3: Digital Twins (Gazebo & Unity)',
      link: {
        type: 'doc',
        id: 'mod-3-digital-twins/intro',
      },
      items: [
        'mod-3-digital-twins/ch-01-gazebo-intro',
      ],
    },
    {
      type: 'category',
      label: 'Module 4: NVIDIA Isaac Platform',
      link: {
        type: 'doc',
        id: 'mod-4-isaac/intro',
      },
      items: [
        'mod-4-isaac/ch-01-isaac-sim-setup',
      ],
    },
    {
      type: 'category',
      label: 'Module 5: Vision-Language-Action',
      link: {
        type: 'doc',
        id: 'mod-5-vla/intro',
      },
      items: [
        'mod-5-vla/ch-01-vla-overview',
      ],
    },
    {
      type: 'category',
      label: 'Module 6: Conversational Humanoid Capstone',
      link: {
        type: 'doc',
        id: 'mod-6-capstone/intro',
      },
      items: [
        'mod-6-capstone/ch-01-project-overview',
      ],
    },
  ],
};

export default sidebars;
