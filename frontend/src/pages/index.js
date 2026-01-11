import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

/**
 * Animated Circuit Background
 * Creates a dynamic grid of circuit-like patterns
 * Adapts colors for light/dark mode
 */
function CircuitBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];

    // Get theme-aware colors
    const getColors = () => {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      return {
        bg: isLight ? 'rgba(248, 250, 252, 0.1)' : 'rgba(10, 10, 15, 0.1)',
        grid: isLight ? 'rgba(8, 145, 178, 0.04)' : 'rgba(0, 212, 255, 0.03)',
        particle: isLight ? '8, 145, 178' : '0, 212, 255',
      };
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticle = () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.2,
    });

    const initParticles = () => {
      particles = [];
      const count = Math.floor((canvas.width * canvas.height) / 15000);
      for (let i = 0; i < count; i++) {
        particles.push(createParticle());
      }
    };

    const drawGrid = (colors) => {
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;

      const gridSize = 60;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    };

    const animate = () => {
      const colors = getColors();

      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawGrid(colors);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colors.particle}, ${p.opacity})`;
        ctx.fill();

        // Connect nearby particles
        particles.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${colors.particle}, ${0.1 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    resize();
    initParticles();
    animate();

    window.addEventListener('resize', () => {
      resize();
      initParticles();
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.circuitCanvas} />;
}

/**
 * Hero Section with Animated Background
 */
function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();

  return (
    <header className={styles.heroBanner}>
      <CircuitBackground />
      <div className={styles.heroGlow} />

      <div className={styles.heroContent}>
        <div className={styles.heroLabel}>
          <span className={styles.heroLabelIcon}>◈</span>
          AI-Native Textbook
        </div>

        <h1 className={styles.heroTitle}>
          <span className={styles.heroTitleLine}>Physical AI</span>
          <span className={styles.heroTitleAccent}>&</span>
          <span className={styles.heroTitleLine}>Humanoid Robotics</span>
        </h1>

        <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>

        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <span className={styles.heroStatValue}>6</span>
            <span className={styles.heroStatLabel}>Modules</span>
          </div>
          <div className={styles.heroStatDivider} />
          <div className={styles.heroStat}>
            <span className={styles.heroStatValue}>24+</span>
            <span className={styles.heroStatLabel}>Chapters</span>
          </div>
          <div className={styles.heroStatDivider} />
          <div className={styles.heroStat}>
            <span className={styles.heroStatValue}>∞</span>
            <span className={styles.heroStatLabel}>AI Assistance</span>
          </div>
        </div>

        <div className={styles.heroButtons}>
          <Link
            className={clsx('button button--primary button--lg', styles.heroButtonPrimary)}
            to="/docs/mod-1-physical-ai/intro"
          >
            Start Learning
            <svg className={styles.buttonArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            className={clsx('button button--secondary button--lg', styles.heroButtonSecondary)}
            to="/docs/mod-1-physical-ai/intro"
          >
            View Curriculum
          </Link>
        </div>
      </div>

      <div className={styles.heroScroll}>
        <span>Scroll to explore</span>
        <div className={styles.heroScrollIcon}>
          <div className={styles.heroScrollDot} />
        </div>
      </div>
    </header>
  );
}

/**
 * Module Icons as SVGs
 */
const ModuleIcons = {
  foundations: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  ),
  ros2: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  twins: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <path d="M10 6.5h4M6.5 10v4M17.5 10v4M10 17.5h4" />
    </svg>
  ),
  isaac: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
    </svg>
  ),
  vla: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
  capstone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
      <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.3" />
    </svg>
  ),
};

/**
 * Module Data with Colors and Icons
 */
const ModuleList = [
  {
    title: 'Physical AI Foundations',
    module: '01',
    description: 'Core concepts of embodied intelligence and the principles that make physical AI unique.',
    link: '/docs/mod-1-physical-ai/intro',
    color: '#00d4ff',
    icon: 'foundations',
    topics: ['Embodied AI', 'Sensors', 'Actuators'],
  },
  {
    title: 'ROS 2 Nervous System',
    module: '02',
    description: 'Master robotics middleware architecture for building scalable robot systems.',
    link: '/docs/mod-2-ros2/intro',
    color: '#8b5cf6',
    icon: 'ros2',
    topics: ['Nodes', 'Topics', 'Services'],
  },
  {
    title: 'Digital Twins',
    module: '03',
    description: 'Create simulation environments with Gazebo and Unity for safe experimentation.',
    link: '/docs/mod-3-digital-twins/intro',
    color: '#10b981',
    icon: 'twins',
    topics: ['Gazebo', 'Physics', 'Simulation'],
  },
  {
    title: 'NVIDIA Isaac Platform',
    module: '04',
    description: 'Industrial-grade simulation and AI training for production robotics.',
    link: '/docs/mod-4-isaac/intro',
    color: '#f97316',
    icon: 'isaac',
    topics: ['Isaac Sim', 'Reinforcement Learning', 'Omniverse'],
  },
  {
    title: 'Vision-Language-Action',
    module: '05',
    description: 'Multimodal AI architectures that connect perception to physical action.',
    link: '/docs/mod-5-vla/intro',
    color: '#ff00aa',
    icon: 'vla',
    topics: ['VLA Models', 'Imitation Learning', 'Transformers'],
  },
  {
    title: 'Capstone Project',
    module: '06',
    description: 'Build a conversational humanoid robot integrating all learned concepts.',
    link: '/docs/mod-6-capstone/intro',
    color: '#eab308',
    icon: 'capstone',
    topics: ['Integration', 'Deployment', 'Demo'],
  },
];

/**
 * Single Module Card Component
 */
function ModuleCard({ title, module, description, link, color, icon, topics }) {
  return (
    <Link to={link} className={styles.moduleCard} style={{ '--module-color': color }}>
      <div className={styles.moduleCardGlow} />

      <div className={styles.moduleCardHeader}>
        <div className={styles.moduleNumber}>
          <span>Module</span>
          <strong>{module}</strong>
        </div>
        <div className={styles.moduleIcon}>{ModuleIcons[icon]}</div>
      </div>

      <h3 className={styles.moduleTitle}>{title}</h3>

      <p className={styles.moduleDescription}>{description}</p>

      <div className={styles.moduleTopics}>
        {topics.map((topic, idx) => (
          <span key={idx} className={styles.moduleTopic}>
            {topic}
          </span>
        ))}
      </div>

      <div className={styles.moduleArrow}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

/**
 * Modules Grid Section
 */
function HomepageModules() {
  return (
    <section className={styles.modulesSection}>
      <div className={styles.modulesContainer}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>Curriculum</span>
          <h2 className={styles.sectionTitle}>Master Physical AI</h2>
          <p className={styles.sectionSubtitle}>
            A comprehensive journey from foundational concepts to building your own humanoid robot
          </p>
        </div>

        <div className={styles.modulesGrid}>
          {ModuleList.map((props, idx) => (
            <ModuleCard key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Features Section
 */
function HomepageFeatures() {
  const features = [
    {
      icon: '🤖',
      title: 'AI-Assisted Learning',
      description: 'Get instant answers from our intelligent chatbot trained on the entire curriculum.',
    },
    {
      icon: '🧪',
      title: 'Hands-On Labs',
      description: 'Practice with real code examples, simulations, and guided exercises.',
    },
    {
      icon: '📊',
      title: 'Industry Standards',
      description: 'Learn production-ready tools used by leading robotics companies worldwide.',
    },
  ];

  return (
    <section className={styles.featuresSection}>
      <div className={styles.featuresContainer}>
        {features.map((feature, idx) => (
          <div key={idx} className={styles.featureCard}>
            <div className={styles.featureIcon}>{feature.icon}</div>
            <h3 className={styles.featureTitle}>{feature.title}</h3>
            <p className={styles.featureDescription}>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Main Homepage Component
 */
export default function Home() {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout
      title={`${siteConfig.title}`}
      description="AI-native textbook for Physical AI and Humanoid Robotics"
    >
      <main role="main" className={styles.mainContent}>
        <HomepageHeader />
        <HomepageModules />
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
